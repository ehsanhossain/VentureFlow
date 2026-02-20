<?php

namespace App\Http\Controllers;
use App\Models\Buyer;
use App\Models\Seller;
use App\Models\ActivityLog;
use App\Models\BuyersCompanyOverview;
use App\Models\BuyersTargetPreferences;
use App\Models\FileFolder;
use Illuminate\Http\Request;
use App\Models\BuyersFinancialDetails;
use App\Models\BuyersPartnershipDetails;
use App\Models\BuyersTeaserCenters;
use App\Models\SellersCompanyOverview;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use DB;
use Carbon\Carbon;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use App\Notifications\NewRegistrationNotification;
use App\Models\Deal;
use App\Jobs\ComputeMatchesJob;


class BuyerController extends Controller
{

    /**
     * Lightweight fetch: returns all active buyers with just id, code, and name.
     * Used for "Introduced Projects" dropdown in Target Registration.
     */
    public function fetchAll()
    {
        $buyers = Buyer::where(function($q) {
                $q->where('status', '1')->orWhereNull('status');
            })
            ->with(['companyOverview:id,reg_name'])
            ->select('id', 'buyer_id', 'company_overview_id', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($b) {
                return [
                    'id'   => $b->id,
                    'code' => $b->buyer_id,
                    'name' => $b->companyOverview->reg_name ?? '',
                ];
            });

        return response()->json(['data' => $buyers]);
    }

    /**
     * Return the min and max investment budget values across all buyers.
     * Used by the frontend range slider filter.
     */
    public function budgetRange()
    {
        $range = Cache::remember('buyer_budget_range', 1800, function () {
            // Database-agnostic: fetch raw JSON and parse in PHP
            // (SQLite doesn't support JSON_UNQUOTE / JSON_VALID)
            $rows = \DB::table('buyers_financial_details')
                ->whereNotNull('investment_budget')
                ->where('investment_budget', '!=', '')
                ->pluck('investment_budget');

            $minVal = null;
            $maxVal = null;

            foreach ($rows as $raw) {
                $budget = is_string($raw) ? json_decode($raw, true) : (is_array($raw) ? $raw : null);
                if (!is_array($budget)) continue;

                $bMin = isset($budget['min']) ? (float) $budget['min'] : null;
                $bMax = isset($budget['max']) ? (float) $budget['max'] : null;

                if ($bMin !== null && ($minVal === null || $bMin < $minVal)) {
                    $minVal = $bMin;
                }
                if ($bMax !== null && ($maxVal === null || $bMax > $maxVal)) {
                    $maxVal = $bMax;
                }
            }

            return [
                'min' => $minVal ?? 0,
                'max' => $maxVal ?? 100000000,
            ];
        });

        return response()->json($range);
    }

    public function index(Request $request)
    {
        try {
        $search = $request->input('search', '');
        $country = $request->input('country');
        $registeredAfter = $request->input('registered_after');
        $registeredBefore = $request->input('registered_before');
        $pipelineStage = $request->input('pipeline_stage');
        $targetCountries = $request->input('target_countries', []);
        $status = $request->input('status');
        $source = $request->input('source');
        $broaderIndustries = $request->input('broader_industries', []);
        $priorityIndustries = $request->input('priority_industries', []);
        $showOnlyPinned = $request->input('show_only_pinned');
        $sort = $request->input('sort');
        $rank = $request->input('rank');
        $reasonMa = $request->input('reason_ma');
        $investmentCondition = $request->input('investment_condition');

        // --- Retrieve range-based parameters ---
        $acquisitionPreference = $request->input('acquisition_preference', []);
        $ebitdaRequirements = $request->input('ebitda_requirements', []);
        $expectedInvestmentAmount = $request->input('expected_investment_amount', []);

        // --- Currency-aware filtering ---
        $displayCurrencyCode = $request->input('display_currency');
        $displayRate = 1; // Default to USD (rate = 1)
        if ($displayCurrencyCode) {
            $displayCurrency = \App\Models\Currency::where('currency_code', $displayCurrencyCode)->first();
            if ($displayCurrency) {
                $displayRate = (float) $displayCurrency->exchange_rate ?: 1;
            }
        }

        // --- Check User Role ---
        $user = $request->user();
        $isPartner = $user && ($user->hasRole('partner') || $user->is_partner);

        $allowedFields = null;
        $partnerId = null;
        if ($isPartner) {
            $allowedFields = $this->getParsedAllowedFields('buyer');
            // Get the partner_id from the user's associated partner record
            $partnerId = $user->partner_id ?? $user->partner?->id ?? null;
        }

        // --- Build the base query ---
        $query = Buyer::query();

        // --- Partner Filtering: Only show prospects assigned to this partner ---
        if ($isPartner && $partnerId) {
            $query->whereHas('partnershipDetails', function ($q) use ($partnerId) {
                $q->where('partner', $partnerId);
            });
        }

        // --- Select Fields & Eager Load ---
        if ($isPartner && $allowedFields) {
            // Select allowed root fields + necessary foreign keys
            $rootFields = array_unique(array_merge(['id', 'pinned', 'created_at'], $allowedFields['root']));
            
            // ALWAYS include Foreign Keys to ensure Eager Loading works
            $rootFields = array_merge($rootFields, [
                'company_overview_id',
                'target_preference_id',
                'financial_detail_id',
                'partnership_detail_id',
                'teaser_center_id'
            ]);

            $query->select($rootFields);

            // Eager load with constraints
            $query->with([
                'companyOverview' => function($q) use ($allowedFields) {
                    if (isset($allowedFields['relationships']['companyOverview'])) {
                        // Ensure hq_country is always included for country display
                        $fields = array_merge(['id', 'hq_country'], $allowedFields['relationships']['companyOverview']);
                        $q->select(array_unique($fields));
                    } else {
                        $q->select('id', 'hq_country'); 
                    }
                    // Always load the hqCountry relation for country name/flag
                    $q->with('hqCountry');
                },
                'targetPreference' => function($q) use ($allowedFields) {
                    if (isset($allowedFields['relationships']['targetPreference'])) {
                         $q->select(array_merge(['id'], $allowedFields['relationships']['targetPreference']));
                    } else {
                        $q->select('id');
                    }
                },
                'financialDetails' => function($q) use ($allowedFields) {
                    if (isset($allowedFields['relationships']['financialDetails'])) {
                        $q->select(array_merge(['id'], $allowedFields['relationships']['financialDetails']));
                    } else {
                        $q->select('id');
                    }
                },
                'partnershipDetails' => function($q) use ($allowedFields) {
                    if (isset($allowedFields['relationships']['partnershipDetails'])) {
                        $q->select(array_merge(['id'], $allowedFields['relationships']['partnershipDetails']));
                    } else {
                        $q->select('id');
                    }
                },
                'teaserCenter' => function($q) use ($allowedFields) {
                    if (isset($allowedFields['relationships']['teaserCenter'])) {
                        $q->select(array_merge(['id'], $allowedFields['relationships']['teaserCenter']));
                    } else {
                        $q->select('id');
                    }
                },
                // Hide deals for partners unless explicitly needed (usually sensitive)
                'deals' => function($q) use ($isPartner) {
                     // For now, return empty or limit fields if needed. 
                     // Assuming 'deals' contains pipeline status which might be sensitive or public?
                     // If partner, maybe we hide detailed deal info?
                     // The frontend uses 'stage_name' from deals. 
                     // Let's assume we allow minimal deal info like 'stage_name' if needed, or hide it.
                     // For safety, let's allow it but we might want to restrict fields later.
                     $q->select('id', 'buyer_id', 'stage_code', 'progress_percent', 'created_at');
                }
            ]);

        } else {
            // Admin: Load everything including hqCountry for country display
            $query->with([
                'companyOverview.hqCountry',
                'targetPreference',
                'financialDetails',
                'partnershipDetails',
                'teaserCenter',
                'deals'
            ]);
        }

            // --- General search filter ---
            $query->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('buyer_id', 'like', "%{$search}%")
                        ->orWhereHas('companyOverview', function ($q) use ($search) {
                            $q->where('reg_name', 'like', "%{$search}%");
                        });
                });
            })
            // --- Filter by country (supports single ID or array of IDs) ---
            ->when($country, function ($query) use ($country) {
                $query->whereHas('companyOverview', function ($q) use ($country) {
                    if (is_array($country)) {
                        $q->whereIn('hq_country', $country);
                    } else {
                        $q->where('hq_country', $country);
                    }
                });
            })
            // --- Filter by registration date range ---
            ->when($registeredAfter, function ($query) use ($registeredAfter) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $registeredAfter, 'Asia/Dhaka')
                        ->startOfDay()
                        ->setTimezone('UTC');
                    $query->where('created_at', '>=', $date);
                } catch (\Exception $e) {
                    // Ignore invalid date format
                }
            })
            ->when($registeredBefore, function ($query) use ($registeredBefore) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $registeredBefore, 'Asia/Dhaka')
                        ->endOfDay()
                        ->setTimezone('UTC');
                    $query->where('created_at', '<=', $date);
                } catch (\Exception $e) {
                    // Ignore invalid date format
                }
            })
            // --- Filter by pipeline stage ---
            ->when($pipelineStage, function ($query) use ($pipelineStage) {
                $query->whereHas('deals', function ($q) use ($pipelineStage) {
                    $q->where('stage_code', $pipelineStage)->where('status', 'active');
                });
            })
            // --- Filter by target countries ---
            ->when(!empty($targetCountries), function ($query) use ($targetCountries) {
                $query->whereHas('companyOverview', function ($q) use ($targetCountries) {
                    $q->where(function ($q2) use ($targetCountries) {
                        foreach ($targetCountries as $id) {
                            // SQLite-compatible: match "id":N in JSON array
                            $q2->orWhere('target_countries', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            // --- Filter by status ---
            ->when(!empty($status), function ($query) use ($status) {
                $query->whereHas('companyOverview', function ($q) use ($status) {
                    $q->where('status', 'LIKE', trim($status));
                });
            }, function ($query) {
                $query->whereHas('companyOverview', function ($q) {
                    $q->where('status', 'Active');
                });
            })

            // --- Filter by source ---
            ->when($source, function ($query) use ($source) {
                $query->whereHas('partnershipDetails', function ($q) use ($source) {
                    $q->where('partnership_affiliation', $source);
                });
            })
            // --- Filter by broader target industries (JSON) ---
            ->when(!empty($broaderIndustries), function ($query) use ($broaderIndustries) {
                $query->whereHas('targetPreference', function ($q) use ($broaderIndustries) {
                    $q->where(function ($q2) use ($broaderIndustries) {
                        foreach ($broaderIndustries as $id) {
                            // SQLite-compatible: match "id":N in JSON array
                            $q2->orWhere('b_ind_prefs', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            // --- Filter by priority target industries (JSON) ---
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('targetPreference', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            // SQLite-compatible: match "id":N in JSON array
                            $q2->orWhere('n_ind_prefs', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })

            // --- Filter by EBITDA requirements range (currency-aware) ---
            ->when(!empty($ebitdaRequirements), function ($query) use ($ebitdaRequirements, $displayRate) {
                $query->whereHas('financialDetails', function ($q) use ($ebitdaRequirements, $displayRate) {
                    if (isset($ebitdaRequirements['min']) && is_numeric($ebitdaRequirements['min'])) {
                        $q->whereRaw(
                            'CAST(json_extract(expected_ebitda, \'$.max\') AS REAL) >= ? * COALESCE((SELECT exchange_rate FROM currencies WHERE id = buyers_financial_details.default_currency OR currency_code = buyers_financial_details.default_currency LIMIT 1), 1) / ?',
                            [$ebitdaRequirements['min'], $displayRate]
                        );
                    }
                    if (isset($ebitdaRequirements['max']) && is_numeric($ebitdaRequirements['max'])) {
                        $q->whereRaw(
                            'CAST(json_extract(expected_ebitda, \'$.min\') AS REAL) <= ? * COALESCE((SELECT exchange_rate FROM currencies WHERE id = buyers_financial_details.default_currency OR currency_code = buyers_financial_details.default_currency LIMIT 1), 1) / ?',
                            [$ebitdaRequirements['max'], $displayRate]
                        );
                    }
                });
            })
            // --- Filter by expected investment amount range (currency-aware) ---
            ->when(!empty($expectedInvestmentAmount), function ($query) use ($expectedInvestmentAmount, $displayRate) {
                $query->whereHas('financialDetails', function ($q) use ($expectedInvestmentAmount, $displayRate) {
                    if (isset($expectedInvestmentAmount['min']) && is_numeric($expectedInvestmentAmount['min'])) {
                        $q->whereRaw(
                            'CAST(json_extract(investment_budget, \'$.max\') AS REAL) >= ? * COALESCE((SELECT exchange_rate FROM currencies WHERE id = buyers_financial_details.default_currency OR currency_code = buyers_financial_details.default_currency LIMIT 1), 1) / ?',
                            [$expectedInvestmentAmount['min'], $displayRate]
                        );
                    }
                    if (isset($expectedInvestmentAmount['max']) && is_numeric($expectedInvestmentAmount['max'])) {
                        $q->whereRaw(
                            'CAST(json_extract(investment_budget, \'$.min\') AS REAL) <= ? * COALESCE((SELECT exchange_rate FROM currencies WHERE id = buyers_financial_details.default_currency OR currency_code = buyers_financial_details.default_currency LIMIT 1), 1) / ?',
                            [$expectedInvestmentAmount['max'], $displayRate]
                        );
                    }
                });
            })
            // --- Filter by rank ---
            ->when($rank, function ($query) use ($rank) {
                $query->whereHas('companyOverview', function ($q) use ($rank) {
                    $q->where('rank', $rank);
                });
            })
            // --- Filter by reason for M&A (purpose) ---
            ->when($reasonMa, function ($query) use ($reasonMa) {
                $query->whereHas('companyOverview', function ($q) use ($reasonMa) {
                    $q->where('reason_ma', 'LIKE', '%' . $reasonMa . '%');
                });
            })
            // --- Filter by investment condition ---
            ->when($investmentCondition, function ($query) use ($investmentCondition) {
                $query->whereHas('companyOverview', function ($q) use ($investmentCondition) {
                    $q->where('investment_condition', 'LIKE', '%' . $investmentCondition . '%');
                });
            })
            // --- Filter by pinned status ---
            ->when($showOnlyPinned === '1', function ($query) {
                $query->where('pinned', true);
            });

        // --- Apply sorting ---
        if ($sort) {
            $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
            $sortColumn = ltrim($sort, '-');
            if (in_array($sortColumn, ['created_at', 'buyer_id', 'pinned'])) {
                $query->orderBy($sortColumn, $direction);
            }
        } else {
            // --- Default sorting ---
            $query->orderByDesc('pinned')->orderByDesc('created_at');
        }

        // --- Paginate results ---
        $perPage = $request->input('per_page', 10);
        $buyers = $query->paginate($perPage);
        $data = ($search && $buyers->isEmpty()) ? [] : $buyers->items();

        // --- Return JSON response ---
        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $buyers->total(),
                'current_page' => $buyers->currentPage(),
                'last_page' => $buyers->lastPage(),
                'per_page' => $buyers->perPage(),
                'allowed_fields' => isset($allowedFields) ? $allowedFields : null,
            ]
        ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Buyer Index Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Internal Error: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    private function getParsedAllowedFields($type)
    {
        return Cache::remember("parsed_allowed_fields_{$type}", 600, function () use ($type) {
            $setting = \App\Models\PartnerSetting::where('setting_key', $type . '_sharing_config')->first();
            
            $parsed = [
                'root' => ['id'], // Always include base ID
                'relationships' => []
            ];

            // If no settings exist, return minimal data
            if (!$setting || !is_array($setting->setting_value)) {
                \Illuminate\Support\Facades\Log::info("No partner sharing settings for type: {$type}");
                return $parsed;
            }

            // Get only explicitly enabled (true) fields
            $enabledFields = array_keys(array_filter($setting->setting_value, function($val) {
                return $val === true;
            }));

            foreach ($enabledFields as $field) {
                if (str_contains($field, '.')) {
                    // Nested field (e.g., company_overview.hq_country)
                    $parts = explode('.', $field);
                    $relation = \Illuminate\Support\Str::camel($parts[0]); // Convert to camelCase
                    $attribute = $parts[1];

                    if (!isset($parsed['relationships'][$relation])) {
                        $parsed['relationships'][$relation] = ['id'];
                    }
                    
                    $parsed['relationships'][$relation][] = $attribute;
                } else {
                    // Root field (e.g., buyer_id, seller_id)
                    $parsed['root'][] = $field;
                }
            }

            return $parsed;
        });
    }



    public function checkId(Request $request)
    {
        $id = $request->input('id');
        $exclude = $request->input('exclude');

        $query = Buyer::where('buyer_id', $id);

        if ($exclude) {
            $query->where('id', '!=', $exclude);
        }

        $exists = $query->exists();

        return response()->json([
            'available' => !$exists
        ]);
    }

    public function getLastSequence(Request $request)
    {
        $countryAlpha = strtoupper($request->input('country'));
        $prefix = $countryAlpha . '-B-';

        try {
            $lastBuyer = Buyer::where('buyer_id', 'LIKE', $prefix . '%')
                ->select('buyer_id')
                ->get()
                ->map(function ($item) use ($prefix) {
                    $numericPart = str_replace($prefix, '', $item->buyer_id);
                    return (int) $numericPart;
                })
                ->max();

            $lastSequence = $lastBuyer ? (int)$lastBuyer : 0;

            return response()->json(['lastSequence' => $lastSequence]);
        } catch (\Exception $e) {
            \Log::error("Error fetching last sequence for country {$countryAlpha}: " . $e->getMessage());
            return response()->json(['error' => 'Could not retrieve sequence number.'], 500);
        }
    }




    public function create()
    {
        //
    }



    public function store(Request $request)
    {
        //
    }

    public function companyOverviewStore(Request $request)
    {
        try {
            $data = $request->all();

            // Sanitize buyer_id - convert empty string to null, keep existing if not provided
            if (isset($data['buyer_id']) && $data['buyer_id'] === '') {
                $data['buyer_id'] = null;
            }

            if ($request->hasFile('profile_picture')) {
                $path = $request->file('profile_picture')->store('buyer_pics', 'public');
                $data['profile_picture'] = $path;
            }


            // Convert JSON/stringified fields
            $jsonFields = [
                'main_industry_operations',
                'niche_industry',
                'seller_phone',
                'shareholder_name',
                'hq_address',
                'contacts',
                'investment_budget',
                'target_countries',
                'introduced_projects',
                'financial_advisor',
                'internal_pic',
                'website', // Added - frontend sends as JSON array
                'company_industry',
            ];

            foreach ($jsonFields as $field) {
                if (isset($data[$field]) && is_string($data[$field])) {
                    $data[$field] = json_decode($data[$field], true);
                }
            }

            $buyer = Buyer::find($data['buyer'] ?? null);
            $isNewOverview = false;

            // UNBREAKABLE: Final check for ID uniqueness to prevent race conditions
            if (!$buyer || ($data['buyer_id'] && $data['buyer_id'] !== $buyer->buyer_id)) {
                $code = $data['buyer_id'];
                $exists = Buyer::where('buyer_id', $code)
                    ->when($buyer, function($q) use ($buyer) { $q->where('id', '!=', $buyer->id); })
                    ->exists();
                if ($exists) {
                    return response()->json(['message' => 'The project code is already in use.'], 422);
                }
            }

            if ($buyer && $buyer->company_overview_id) {
                // Update existing company overview
                $overview = BuyersCompanyOverview::find($buyer->company_overview_id) ?? new BuyersCompanyOverview();
            } else {
                // Create new company overview
                $overview = new BuyersCompanyOverview();
                $isNewOverview = true;
            }

            // Assign fields
            $overview->reg_name = $data['reg_name'] ?? null;
            $overview->hq_country = $data['hq_country'] ?? null;
            $overview->company_type = $data['company_type'] ?? null;
            $overview->year_founded = $data['year_founded'] ?? null;
            $overview->industry_ops = $data['industry_ops'] ?? null;
            $overview->main_industry_operations = $data['main_industry_operations'] ?? null;
            $overview->niche_industry = $data['niche_industry'] ?? null;
            $overview->emp_count = $data['emp_count'] ?? null;

            $overview->reason_ma = $data['reason_ma'] ?? null;
            $overview->proj_start_date = $data['proj_start_date'] ?? null;
            $overview->txn_timeline = $data['txn_timeline'] ?? null;

            $overview->incharge_name = $data['incharge_name'] ?? null;
            $overview->no_pic_needed = $data['no_pic_needed'] ?? false;

            $overview->status = $data['status'] ?? null;
            $overview->details = $data['details'] ?? null;

            $overview->email = $data['email'] ?? null;
            $overview->phone = $data['phone'] ?? null;
            $overview->hq_address = $data['hq_address'] ?? null;
            $overview->shareholder_name = $data['shareholder_name'] ?? null;

            $overview->seller_contact_name = $data['seller_contact_name'] ?? null;
            $overview->seller_designation = $data['seller_designation'] ?? null;
            $overview->seller_email = $data['seller_email'] ?? null;
            $overview->seller_phone = $data['seller_phone'] ?? null;

            $overview->website = $data['website'] ?? null;
            $overview->linkedin = $data['linkedin'] ?? null;
            $overview->twitter = $data['twitter'] ?? null;
            $overview->facebook = $data['facebook'] ?? null;
            $overview->instagram = $data['instagram'] ?? null;
            $overview->youtube = $data['youtube'] ?? null;

            // New fields
            $overview->rank = $data['rank'] ?? null;
            $overview->contacts = $data['contacts'] ?? null;
            $overview->investment_budget = $data['investment_budget'] ?? null;
            $overview->investment_condition = $data['investment_condition'] ?? null;
            $overview->target_countries = $data['target_countries'] ?? null;
            $overview->investor_profile_link = $data['investor_profile_link'] ?? null;
            $overview->introduced_projects = $data['introduced_projects'] ?? null;
            $overview->financial_advisor = $data['financial_advisor'] ?? null;
            $overview->internal_pic = $data['internal_pic'] ?? null;
            $overview->channel = $data['channel'] ?? null;
            $overview->company_industry = $data['company_industry'] ?? null;

            $overview->save();

            // Link to Buyer
            if ($buyer) {
                $buyer->company_overview_id = $overview->id;
                
                // Only update buyer_id if a valid value is provided (not null/empty)
                if (!empty($data['buyer_id'])) {
                    $buyer->buyer_id = $data['buyer_id'];
                }

                if (isset($data['profile_picture'])) {
                    $buyer->image = $data['profile_picture'];
                }

                $buyer->save();

                // Add Activity Log
                ActivityLog::create([
                    'user_id' => \Auth::id(),
                    'loggable_id' => $buyer->id,
                    'loggable_type' => Buyer::class,
                    'type' => 'system',
                    'content' => "Investor profile updated: " . ($overview->reg_name ?? ''),
                ]);

                // MatchIQ: Recompute matches after investor profile update
                ComputeMatchesJob::dispatch('buyer', $buyer->id)->delay(5);
            } else {
                // Create new Buyer if it doesn't exist
                // Validate buyer_id is provided for new records (database requires it)
                if (empty($data['buyer_id'])) {
                    return response()->json(['message' => 'Project Code is required for new investors.'], 422);
                }
                
                $buyer = Buyer::create([
                    'buyer_id' => $data['buyer_id'],
                    'image' => $data['profile_picture'] ?? null,
                    'company_overview_id' => $overview->id,
                    'status' => '1',
                ]);

                // Add Activity Log
                ActivityLog::create([
                    'user_id' => \Auth::id(),
                    'loggable_id' => $buyer->id,
                    'loggable_type' => Buyer::class,
                    'type' => 'system',
                    'content' => "New Investor profile registered: " . ($overview->reg_name ?? ''),
                ]);

                 // Notify System Admins
                 try {
                    $admins = User::role('System Admin')->get();
                    Notification::send($admins, new NewRegistrationNotification('Buyer', $overview->reg_name ?? 'New Buyer', $buyer->id, Auth::user()));
                } catch (\Exception $e) {
                    Log::error('Notification failed: ' . $e->getMessage());
                }

                // MatchIQ: Compute matches for new investor in background
                try {
                    ComputeMatchesJob::dispatch('buyer', $buyer->id)->delay(5);
                } catch (\Exception $e) {
                    Log::error('MatchIQ dispatch failed: ' . $e->getMessage());
                }
            }

            return response()->json([
                'message' => $isNewOverview ? 'Company overview submitted successfully.' : 'Company overview updated successfully.',
                'data' => $buyer->id,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('CompanyOverviewStore Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'buyer_param' => $data['buyer'] ?? null,
                'buyer_id_param' => $data['buyer_id'] ?? null,
            ]);
            return response()->json([
                'message' => 'Failed to submit company overview.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function targetPreferencesStore(Request $request)
    {
        try {
            $buyer = Buyer::find($request->input('buyer_id'));

            if (!$buyer) {
                return response()->json([
                    'message' => 'Buyer not found.'
                ], 404);
            }

            // If buyer already has target preferences, update them
            if ($buyer->target_preference_id) {
                $preference = BuyersTargetPreferences::find($buyer->target_preference_id);

                if (!$preference) {
                    // If the record somehow doesn't exist, fallback to a new instance
                    $preference = new BuyersTargetPreferences();
                }
            } else {
                $preference = new BuyersTargetPreferences();
            }

            // Assign input data
            $preference->b_ind_prefs = $request->input('b_ind_prefs');
            $preference->n_ind_prefs = $request->input('n_ind_prefs');
            $preference->target_countries = $request->input('target_countries');
            $preference->main_market = $request->input('main_market');
            $preference->emp_count_range = $request->input('employeeCountRange');
            $preference->mgmt_retention = $request->input('managementRetention');
            $preference->years_in_biz = $request->input('N_Y_B');
            $preference->timeline = $request->input('timeline');
            $preference->company_type = $request->input('company_type');
            $preference->cert = $request->input('cert');

            // Save the preferences
            $preference->save();

            // Link to buyer if not already linked
            if (!$buyer->target_preference_id) {
                $buyer->target_preference_id = $preference->id;
                $buyer->save();
            }

            return response()->json([
                'message' => $buyer->wasRecentlyCreated ? 'Target preferences created successfully.' : 'Target preferences updated successfully.',
                'data' => $buyer->id,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to store target preferences.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function financialDetailsStore(Request $request)
    {
        try {
            $buyerId = $request->input('buyer_id');
            $buyer = Buyer::find($buyerId);

            if (!$buyer) {
                return response()->json([
                    'message' => 'Buyer not found.'
                ], 404);
            }

            // Update existing financial detail or create new
            if ($buyer->financial_detail_id) {
                $financialDetail = BuyersFinancialDetails::find($buyer->financial_detail_id);
                if (!$financialDetail) {
                    $financialDetail = new BuyersFinancialDetails();
                }
            } else {
                $financialDetail = new BuyersFinancialDetails();
            }

            // Fill in the fields
            $financialDetail->default_currency = $request->input('defaultCurrency');
            $financialDetail->ebitda_margin_latest = $request->input('ebitdaMarginLatestYear');
            $financialDetail->growth_rate_yoy = $request->input('growthRate');
            $financialDetail->revenue_growth_avg_3y = $request->input('revenueGrowthRate');
            $financialDetail->ma_structure = $request->input('mnaStructure');
            $financialDetail->profit_criteria = $request->input('profitCriteria');

            $financialDetail->investment_budget = $request->input('investment_budget');
            $financialDetail->expected_ebitda = $request->input('expected_ebitda');
            $financialDetail->profit_multiple = $request->input('profit_multiple');
            $financialDetail->ttm_revenue = $request->input('ttm_revenue');
            $financialDetail->ttm_profit = $request->input('ttm_profit');
            $financialDetail->acquire_pct = $request->input('acquire_pct');
            $financialDetail->acquire_pct = $request->input('acquire_pct');
            $financialDetail->shareholding = $request->input('shareholding');
            $financialDetail->valuation = $request->input('valuation');
            $financialDetail->ebitda_multiple = $request->input('ebitda_multiple');

            $financialDetail->is_minority = $request->boolean('is_minority');
            $financialDetail->is_majority = $request->boolean('is_majority');
            $financialDetail->is_negotiable = $request->boolean('is_negotiable');

            $financialDetail->save();

            // Associate the financial detail with the buyer if not already linked
            if (!$buyer->financial_detail_id) {
                $buyer->financial_detail_id = $financialDetail->id;
                $buyer->save();
            }

            return response()->json([
                'message' => 'Buyer financial details saved successfully.',
                'data' => $buyer->id,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to store buyer financial details.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function partnershipDetailsStore(Request $request)
    {
        try {
            // Basic sanitization with fallback values
            $partnership = BuyersPartnershipDetails::create([
                'partner' => trim($request->input('partner', '')),
                'referral_bonus_criteria' => trim($request->input('referral_bonus_criteria', '')),
                'referral_bonus_amount' => trim($request->input('referral_bonus_amount', '')),
                'mou_status' => trim($request->input('mou_status', '')),
                'specific_remarks' => trim($request->input('specific_remarks', '')),
                'partnership_affiliation' => $request->input('partnership_affiliation', '0'),
            ]);

            $buyer = Buyer::find($request->input('buyer_id'));

            if (!$buyer) {
                return response()->json([
                    'message' => 'Buyer not found.'
                ], 404);
            }

            $buyer->partnership_detail_id = $partnership->id;
            $buyer->save();

            return response()->json([
                'message' => 'Buyer partnership details saved successfully.',
                'data' => $buyer->id,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to save buyer partnership details.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function teaserCenterStore(Request $request)
    {
        try {
            $data = $request->all();

            $buyer = Buyer::find($request->input('buyer_id'));

            if (!$buyer) {
                return response()->json([
                    'message' => 'Buyer not found.'
                ], 404);
            }

            // Create or update teaser center
            $teaserCenter = $buyer->teaser_center_id
                ? BuyersTeaserCenters::find($buyer->teaser_center_id) ?? new BuyersTeaserCenters()
                : new BuyersTeaserCenters();

            // Basic string & nullable fields
            $teaserCenter->teaser_heading = $data['teaser_heading'] ?? null;
            $teaserCenter->emp_count_range = $data['emp_count_range'] ?? null;
            $teaserCenter->investment_amount = $data['investment_amount'] ?? null;
            $teaserCenter->growth_rate_yoy = $data['growth_rate_yoy'] ?? null;
            $teaserCenter->teaser_details = $data['teaser_details'] ?? null;

            // JSON fields (ensure string is valid JSON)
            $jsonFields = [
                'b_in',
                'target_countries',
                'expected_ebitda',
                'acquire_pct',
                'valuation_range'
            ];

            foreach ($jsonFields as $field) {
                $value = $data[$field] ?? null;

                if (is_string($value)) {
                    $decoded = json_decode($value, true);
                    $teaserCenter->$field = json_last_error() === JSON_ERROR_NONE ? $decoded : null;
                } elseif (is_array($value)) {
                    $teaserCenter->$field = $value;
                } else {
                    $teaserCenter->$field = null;
                }
            }

            // Boolean fields (accepting "0", "1", true, false as strings or bool)
            $booleanFields = [
                'has_teaser_name',
                'has_industry',
                'has_buyer_targeted_countries',
                'has_emp_count_range',
                'has_expected_ebitda',
                'has_acquiring_percentage',
                'has_valuation_range',
                'has_investment_amount',
                'has_growth_rate_yoy',
                'has_border_industry_preference',
                'has_teaser_description',
                // 'is_industry_checked',
            ];

            foreach ($booleanFields as $field) {
                $value = $data[$field] ?? false;
                $teaserCenter->$field = $value === "1" || $value === 1 || $value === true || $value === "true";
            }

            // Save teaser center
            $teaserCenter->save();

            // Attach teaser center to buyer if not set
            if (!$buyer->teaser_center_id) {
                $buyer->teaser_center_id = $teaserCenter->id;
                $buyer->save();
            }

            return response()->json([
                'message' => 'Teaser center details saved successfully.',
                'data' => $teaserCenter  // return saved model instead of raw $data
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to save teaser center details.',
                'error' => $e->getMessage()
            ], 500);
        }
    }






    public function show(Buyer $buyer)
    {
        $request = request();
        $user = $request->user();
        $isPartner = $user && ($user->hasRole('partner') || $user->is_partner);

        if ($isPartner) {
            $allowedFields = $this->getParsedAllowedFields('investor');
            $query = Buyer::where('id', $buyer->id);

            $rootFields = array_unique(array_merge(
                ['id', 'buyer_id', 'pinned', 'created_at', 'pipeline_status', 'updated_at'], 
                $allowedFields['root'] ?? [],
                ['company_overview_id', 'target_preference_id', 'financial_detail_id', 'partnership_detail_id', 'teaser_center_id']
            ));
            $query->select($rootFields);

            $query->with([
                'companyOverview' => function($q) use ($allowedFields) {
                    if (isset($allowedFields['relationships']['companyOverview'])) {
                        $q->select(array_merge(['id', 'hq_country'], $allowedFields['relationships']['companyOverview']));
                    } else { $q->select('id'); }
                    $q->with('hqCountry');
                },
                'targetPreference' => function($q) use ($allowedFields) {
                    if (isset($allowedFields['relationships']['targetPreference'])) {
                        $q->select(array_merge(['id'], $allowedFields['relationships']['targetPreference']));
                    } else { $q->select('id'); }
                },
                'financialDetails' => function($q) use ($allowedFields) {
                    if (isset($allowedFields['relationships']['financialDetails'])) {
                        $q->select(array_merge(['id'], $allowedFields['relationships']['financialDetails']));
                    } else { $q->select('id'); }
                },
                'partnershipDetails' => function($q) use ($allowedFields) {
                    if (isset($allowedFields['relationships']['partnershipDetails'])) {
                        $q->select(array_merge(['id'], $allowedFields['relationships']['partnershipDetails']));
                    } else { $q->select('id'); }
                },
                'teaserCenter' => function($q) use ($allowedFields) {
                    if (isset($allowedFields['relationships']['teaserCenter'])) {
                        $q->select(array_merge(['id'], $allowedFields['relationships']['teaserCenter']));
                    } else { $q->select('id'); }
                },
                'deals' => function($q) {
                     $q->select('id', 'buyer_id', 'stage_code', 'progress_percent', 'created_at');
                }
            ]);

            $result = $query->first();

            if (!$result) {
                return response()->json(['message' => 'Buyer not found or access denied.'], 404);
            }

            return response()->json([
                'data' => $result,
                'meta' => ['allowed_fields' => $allowedFields]
            ]);

        } else {
            // Admin
            $buyer->load([
                'companyOverview.hqCountry',
                'companyOverview.employeeDetails',
                'targetPreference',
                'financialDetails',
                'partnershipDetails',
                'teaserCenter',
                'deals.seller.companyOverview',
                'activityLogs' => function ($q) {
                    $q->with(['user.employee'])->orderBy('created_at', 'desc');
                }
            ]);

            // Format activity logs for frontend
            $formattedLogs = $buyer->activityLogs->map(function ($log) {
                $userName = 'Ventureflow';
                $avatar = null;
                $isSystem = $log->type === 'system';

                if ($log->user) {
                    if ($log->user->employee) {
                        $userName = trim($log->user->employee->first_name . ' ' . $log->user->employee->last_name);
                        $avatar = $log->user->employee->image ? asset('storage/' . $log->user->employee->image) : null;
                    } else {
                        $userName = $log->user->name;
                    }
                }

                return [
                    'id' => $log->id,
                    'type' => $log->type,
                    'author' => $isSystem ? 'Ventureflow' : $userName,
                    'avatar' => $avatar,
                    'content' => $log->content,
                    'timestamp' => $log->created_at,
                    'isSystem' => $isSystem,
                    'metadata' => $log->metadata,
                ];
            });

            // Format deals as introduced projects for frontend
            $introducedProjects = $buyer->deals->map(function ($deal) {
                $sellerName = 'Unknown Target';
                $sellerCode = 'N/A';
                
                if ($deal->seller && $deal->seller->companyOverview) {
                    $sellerName = $deal->seller->companyOverview->reg_name ?? 'Unknown Target';
                }
                if ($deal->seller) {
                    $sellerCode = $deal->seller->seller_id ?? 'N/A';
                }

                return [
                    'id' => $deal->seller ? $deal->seller->id : null,
                    'deal_id' => $deal->id,
                    'code' => $sellerCode,
                    'name' => $sellerName,
                    'stage_code' => $deal->stage_code,
                    'stage_name' => $deal->stage_name,
                    'buyer_stage_name' => $deal->buyer_stage_name,
                    'seller_stage_name' => $deal->seller_stage_name,
                    'progress' => $deal->progress_percent,
                    'introduced_at' => $deal->created_at,
                ];
            });

            $buyerData = $buyer->toArray();
            $buyerData['formatted_activity_logs'] = $formattedLogs;
            $buyerData['formatted_introduced_projects'] = $introducedProjects;

            return response()->json([
                'data' => $buyerData
            ]);
        }
    }


    public function pinned(Buyer $buyer)
    {
        try {
            $buyer->pinned = !$buyer->pinned;
            $buyer->save();

            return response()->json([
                'message' => 'Buyer pinned status updated successfully.',
                'data' => $buyer,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating buyer pinned status: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to update pinned status.',
                'error' => $e->getMessage()
            ], 500);
        }
    }




    public function edit(Buyer $buyer)
    {
        //
    }


    public function update(Request $request, Buyer $buyer)
    {
        //
    }


    public function getDeleteImpact(Request $request)
    {
        try {
            $ids = $request->input('ids', []);
            if (!is_array($ids)) {
                $ids = [$ids];
            }

            if (empty($ids)) {
                return response()->json([
                    'message' => 'No IDs provided.'
                ], 400);
            }

            // Count how many sellers reference these buyers in their introduced_projects JSON
            $introducedProjectsCount = 0;
            $allSellerOverviews = SellersCompanyOverview::whereNotNull('introduced_projects')->get();
            foreach ($allSellerOverviews as $overview) {
                $projects = is_array($overview->introduced_projects) ? $overview->introduced_projects : json_decode($overview->introduced_projects, true);
                if (!is_array($projects)) continue;
                foreach ($projects as $project) {
                    if (isset($project['id']) && in_array($project['id'], array_map('intval', $ids))) {
                        $introducedProjectsCount++;
                    }
                }
            }

            $impact = [
                'count' => count($ids),
                'deals' => Deal::whereIn('buyer_id', $ids)->count(),
                'active_deals' => Deal::whereIn('buyer_id', $ids)
                    ->where('progress_percent', '<', 100)
                    ->count(),
                'introduced_projects' => $introducedProjectsCount,
                'files' => FileFolder::whereIn('buyer_id', $ids)->count(),
                'activities' => ActivityLog::where('loggable_type', Buyer::class)
                    ->whereIn('loggable_id', $ids)
                    ->count(),
            ];

            return response()->json($impact);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to analyze impact.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request)
    {
        try {
            $idsToDelete = $request->input('ids');

            if (empty($idsToDelete)) {
                return response()->json([
                    'message' => 'No Buyer IDs provided for deletion.'
                ], 400);
            }

            if (!is_array($idsToDelete)) {
                $idsToDelete = [$idsToDelete];
            }

            $deletedCount = 0;

            DB::transaction(function () use ($idsToDelete, &$deletedCount) {
                // Fetch buyers to get related record IDs before they are deleted
                $buyers = Buyer::whereIn('id', $idsToDelete)->get();
                $overviewIds = $buyers->pluck('company_overview_id')->filter()->toArray();
                $preferenceIds = $buyers->pluck('target_preference_id')->filter()->toArray();
                $financialIds = $buyers->pluck('financial_detail_id')->filter()->toArray();
                $partnershipIds = $buyers->pluck('partnership_detail_id')->filter()->toArray();
                $teaserIds = $buyers->pluck('teaser_center_id')->filter()->toArray();

                // 1. Delete polymorphic logs
                ActivityLog::where('loggable_type', Buyer::class)
                    ->whereIn('loggable_id', $idsToDelete)
                    ->delete();
                
                // 2. Delete file associations
                FileFolder::whereIn('buyer_id', $idsToDelete)->delete();

                // 3. Clean up introduced_projects references from sellers' company overviews
                // When a buyer is deleted, any seller that references this buyer in their
                // introduced_projects JSON must have that reference removed.
                $intIdsToDelete = array_map('intval', $idsToDelete);
                $sellerOverviews = SellersCompanyOverview::whereNotNull('introduced_projects')->get();
                foreach ($sellerOverviews as $sellerOverview) {
                    $projects = is_array($sellerOverview->introduced_projects) ? $sellerOverview->introduced_projects : json_decode($sellerOverview->introduced_projects, true);
                    if (!is_array($projects)) continue;
                    $filtered = array_values(array_filter($projects, function ($project) use ($intIdsToDelete) {
                        return !isset($project['id']) || !in_array((int)$project['id'], $intIdsToDelete);
                    }));
                    if (count($filtered) !== count($projects)) {
                        $sellerOverview->introduced_projects = $filtered;
                        $sellerOverview->save();
                    }
                }

                // 4. Delete the buyers (Deals will cascade if set in DB, but we already know they exist)
                // Note: Buyer model doesn't have soft deletes currently.
                $deletedCount = Buyer::whereIn('id', $idsToDelete)->delete();

                // 5. Clean up the detailed records (orphaned after buyer is deleted)
                if (!empty($overviewIds)) {
                    BuyersCompanyOverview::whereIn('id', $overviewIds)->delete();
                }
                if (!empty($preferenceIds)) {
                    BuyersTargetPreferences::whereIn('id', $preferenceIds)->delete();
                }
                if (!empty($financialIds)) {
                    BuyersFinancialDetails::whereIn('id', $financialIds)->delete();
                }
                if (!empty($partnershipIds)) {
                    BuyersPartnershipDetails::whereIn('id', $partnershipIds)->delete();
                }
                if (!empty($teaserIds)) {
                    BuyersTeaserCenters::whereIn('id', $teaserIds)->delete();
                }
            });

            if ($deletedCount > 0) {
                $message = $deletedCount === 1
                    ? 'Investor and all related data deleted successfully.'
                    : $deletedCount . ' investors and all related data deleted successfully.';

                return response()->json([
                    'message' => $message
                ], 200);
            } else {
                return response()->json([
                    'message' => 'No investors found with the provided IDs.'
                ], 404);
            }
        } catch (\Exception $e) {
            Log::error('Error deleting buyer(s): ' . $e->getMessage(), [
                'exception' => $e,
                'ids_provided' => $request->input('ids')
            ]);

            return response()->json([
                'message' => 'Failed to delete investor(s).',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function pinnedData(Request $request)
    {
        $search = $request->input('search', '');
        $country = $request->input('country');
        $registeredAfter = $request->input('registered_after');
        $status = $request->input('status');
        $source = $request->input('source');
        $broaderIndustries = $request->input('broader_industries', []);
        $priorityIndustries = $request->input('priority_industries', []);
        $showOnlyPinned = $request->input('show_only_pinned');
        $sort = $request->input('sort');

        // --- Retrieve range-based parameters ---
        $acquisitionPreference = $request->input('acquisition_preference', []);
        $ebitdaRequirements = $request->input('ebitda_requirements', []);
        $expectedInvestmentAmount = $request->input('expected_investment_amount', []);


        $buyers = Buyer::with([
            'companyOverview',
            'targetPreference',
            'financialDetails',
            'partnershipDetails',
            'teaserCenter',
        ])
            ->whereHas('companyOverview', function ($query) {
                $query->whereIn('status', ['Active', 'In Progress', 'Interested']);
            })
            ->when($search, function ($query) use ($search) {
                $query->whereHas('companyOverview', function ($q) use ($search) {
                    $q->where('reg_name', 'like', "%{$search}%");
                });
            })
              // --- Filter by country ---
            ->when($country, function ($query) use ($country) {
                $query->whereHas('companyOverview', function ($q) use ($country) {
                    $q->where('hq_country', $country);
                });
            })
            // --- Filter by registration date ---
            ->when($registeredAfter, function ($query) use ($registeredAfter) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $registeredAfter, 'Asia/Dhaka')
                        ->endOfDay()
                        ->setTimezone('UTC');
                    $query->where('created_at', '<=', $date);
                } catch (\Exception $e) {
                    // Ignore invalid date format
                }
            })
            // --- Filter by status ---
            ->when(!empty($status), function ($query) use ($status) {
                $query->whereHas('companyOverview', function ($q) use ($status) {
                    $q->where('status', 'LIKE', trim($status));
                });
            })

            // --- Filter by source ---
            ->when($source, function ($query) use ($source) {
                $query->whereHas('partnershipDetails', function ($q) use ($source) {
                    $q->where('partnership_affiliation', $source);
                });
            })
            // --- Filter by broader target industries (JSON) ---
            ->when(!empty($broaderIndustries), function ($query) use ($broaderIndustries) {
                $query->whereHas('targetPreference', function ($q) use ($broaderIndustries) {
                    $q->where(function ($q2) use ($broaderIndustries) {
                        foreach ($broaderIndustries as $id) {
                            $q2->orWhere('target_industries', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            // --- Filter by priority target industries (JSON) ---
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('targetPreference', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhere('target_niche_industries', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })

            ->when(!empty($ebitdaRequirements), function ($query) use ($ebitdaRequirements) {
                $query->whereHas('financialDetails', function ($q) use ($ebitdaRequirements) {
                    if (isset($ebitdaRequirements['min']) && is_numeric($ebitdaRequirements['min'])) {
                        $q->where('expected_ebitda->max', '>=', $ebitdaRequirements['min']);
                    }

                    if (isset($ebitdaRequirements['max']) && is_numeric($ebitdaRequirements['max'])) {
                        $q->where('expected_ebitda->min', '<=', $ebitdaRequirements['max']);
                    }
                });
            })
            // --- Filter by expected investment amount range ---
            ->when(!empty($expectedInvestmentAmount), function ($query) use ($expectedInvestmentAmount) {
                $query->whereHas('financialDetails', function ($q) use ($expectedInvestmentAmount) {
                    if (isset($expectedInvestmentAmount['min']) && is_numeric($expectedInvestmentAmount['min'])) {
                        $q->where('investment_budget->max', '>=', $expectedInvestmentAmount['min']);
                    }

                    if (isset($expectedInvestmentAmount['max']) && is_numeric($expectedInvestmentAmount['max'])) {
                        $q->where('investment_budget->min', '<=', $expectedInvestmentAmount['max']);
                    }
                });
            })
            // --- Filter by pinned status ---
            ->when($showOnlyPinned === '1', function ($query) {
                $query->where('pinned', true);
            })
            ->paginate(10);

        $data = ($search && $buyers->isEmpty()) ? [] : $buyers->items();

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $buyers->total(),
                'current_page' => $buyers->currentPage(),
                'last_page' => $buyers->lastPage(),
                'per_page' => $buyers->perPage(),
            ]
        ]);
    }

    public function unpinnedData(Request $request)
    {
        $search = $request->input('search', '');
        $country = $request->input('country');
        $registeredAfter = $request->input('registered_after');
        $status = $request->input('status');
        $source = $request->input('source');
        $broaderIndustries = $request->input('broader_industries', []);
        $priorityIndustries = $request->input('priority_industries', []);
        $showOnlyPinned = $request->input('show_only_pinned');
        $sort = $request->input('sort');

        // --- Retrieve range-based parameters ---
        $acquisitionPreference = $request->input('acquisition_preference', []);
        $ebitdaRequirements = $request->input('ebitda_requirements', []);
        $expectedInvestmentAmount = $request->input('expected_investment_amount', []);


        $buyers = Buyer::with([
            'companyOverview',
            'targetPreference',
            'financialDetails',
            'partnershipDetails',
            'teaserCenter',
        ])
            ->whereHas('companyOverview', function ($query) {
                $query->whereIn('status', ['Not Interested', 'Canceled', 'In-Active']);
            })
            ->when($search, function ($query) use ($search) {
                $query->whereHas('companyOverview', function ($q) use ($search) {
                    $q->where('reg_name', 'like', "%{$search}%");
                });
            })
              // --- Filter by country ---
            ->when($country, function ($query) use ($country) {
                $query->whereHas('companyOverview', function ($q) use ($country) {
                    $q->where('hq_country', $country);
                });
            })
            // --- Filter by registration date ---
            ->when($registeredAfter, function ($query) use ($registeredAfter) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $registeredAfter, 'Asia/Dhaka')
                        ->endOfDay()
                        ->setTimezone('UTC');
                    $query->where('created_at', '<=', $date);
                } catch (\Exception $e) {
                    // Ignore invalid date format
                }
            })
            // --- Filter by status ---
            ->when(!empty($status), function ($query) use ($status) {
                $query->whereHas('companyOverview', function ($q) use ($status) {
                    $q->where('status', 'LIKE', trim($status));
                });
            })

            // --- Filter by source ---
            ->when($source, function ($query) use ($source) {
                $query->whereHas('partnershipDetails', function ($q) use ($source) {
                    $q->where('partnership_affiliation', $source);
                });
            })
            // --- Filter by broader target industries (JSON) ---
            ->when(!empty($broaderIndustries), function ($query) use ($broaderIndustries) {
                $query->whereHas('targetPreference', function ($q) use ($broaderIndustries) {
                    $q->where(function ($q2) use ($broaderIndustries) {
                        foreach ($broaderIndustries as $id) {
                            $q2->orWhere('target_industries', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            // --- Filter by priority target industries (JSON) ---
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('targetPreference', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhere('target_niche_industries', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })

            ->when(!empty($ebitdaRequirements), function ($query) use ($ebitdaRequirements) {
                $query->whereHas('financialDetails', function ($q) use ($ebitdaRequirements) {
                    if (isset($ebitdaRequirements['min']) && is_numeric($ebitdaRequirements['min'])) {
                        $q->where('expected_ebitda->max', '>=', $ebitdaRequirements['min']);
                    }

                    if (isset($ebitdaRequirements['max']) && is_numeric($ebitdaRequirements['max'])) {
                        $q->where('expected_ebitda->min', '<=', $ebitdaRequirements['max']);
                    }
                });
            })
            // --- Filter by expected investment amount range ---
            ->when(!empty($expectedInvestmentAmount), function ($query) use ($expectedInvestmentAmount) {
                $query->whereHas('financialDetails', function ($q) use ($expectedInvestmentAmount) {
                    if (isset($expectedInvestmentAmount['min']) && is_numeric($expectedInvestmentAmount['min'])) {
                        $q->where('investment_budget->max', '>=', $expectedInvestmentAmount['min']);
                    }

                    if (isset($expectedInvestmentAmount['max']) && is_numeric($expectedInvestmentAmount['max'])) {
                        $q->where('investment_budget->min', '<=', $expectedInvestmentAmount['max']);
                    }
                });
            })
            // --- Filter by pinned status ---
            ->when($showOnlyPinned === '1', function ($query) {
                $query->where('pinned', true);
            })
            ->paginate(10);

        $data = ($search && $buyers->isEmpty()) ? [] : $buyers->items();

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $buyers->total(),
                'current_page' => $buyers->currentPage(),
                'last_page' => $buyers->lastPage(),
                'per_page' => $buyers->perPage(),
            ]
        ]);
    }


    public function closedDeals(Request $request)
    {
        $search = $request->input('search', '');
        $country = $request->input('country');
        $registeredAfter = $request->input('registered_after');
        $status = $request->input('status');
        $source = $request->input('source');
        $broaderIndustries = $request->input('broader_industries', []);
        $priorityIndustries = $request->input('priority_industries', []);
        $showOnlyPinned = $request->input('show_only_pinned');
        $sort = $request->input('sort');

        // --- Retrieve range-based parameters ---
        $acquisitionPreference = $request->input('acquisition_preference', []);
        $ebitdaRequirements = $request->input('ebitda_requirements', []);
        $expectedInvestmentAmount = $request->input('expected_investment_amount', []);


        $buyers = Buyer::with([
            'companyOverview',
            'targetPreference',
            'financialDetails',
            'partnershipDetails',
            'teaserCenter',
        ])
            ->whereHas('companyOverview', function ($query) {
                $query->where('status', 'Deal Closed');
            })
            ->when($search, function ($query) use ($search) {
                $query->whereHas('companyOverview', function ($q) use ($search) {
                    $q->where('reg_name', 'like', "%{$search}%");
                });
            })
              // --- Filter by country ---
            ->when($country, function ($query) use ($country) {
                $query->whereHas('companyOverview', function ($q) use ($country) {
                    $q->where('hq_country', $country);
                });
            })
            // --- Filter by registration date ---
            ->when($registeredAfter, function ($query) use ($registeredAfter) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $registeredAfter, 'Asia/Dhaka')
                        ->endOfDay()
                        ->setTimezone('UTC');
                    $query->where('created_at', '<=', $date);
                } catch (\Exception $e) {
                    // Ignore invalid date format
                }
            })
            // --- Filter by status ---
            ->when(!empty($status), function ($query) use ($status) {
                $query->whereHas('companyOverview', function ($q) use ($status) {
                    $q->where('status', 'LIKE', trim($status));
                });
            })

            // --- Filter by source ---
            ->when($source, function ($query) use ($source) {
                $query->whereHas('partnershipDetails', function ($q) use ($source) {
                    $q->where('partnership_affiliation', $source);
                });
            })
            // --- Filter by broader target industries (JSON) ---
            ->when(!empty($broaderIndustries), function ($query) use ($broaderIndustries) {
                $query->whereHas('targetPreference', function ($q) use ($broaderIndustries) {
                    $q->where(function ($q2) use ($broaderIndustries) {
                        foreach ($broaderIndustries as $id) {
                            $q2->orWhere('target_industries', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            // --- Filter by priority target industries (JSON) ---
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('targetPreference', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhere('target_niche_industries', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })

            ->when(!empty($ebitdaRequirements), function ($query) use ($ebitdaRequirements) {
                $query->whereHas('financialDetails', function ($q) use ($ebitdaRequirements) {
                    if (isset($ebitdaRequirements['min']) && is_numeric($ebitdaRequirements['min'])) {
                        $q->where('expected_ebitda->max', '>=', $ebitdaRequirements['min']);
                    }

                    if (isset($ebitdaRequirements['max']) && is_numeric($ebitdaRequirements['max'])) {
                        $q->where('expected_ebitda->min', '<=', $ebitdaRequirements['max']);
                    }
                });
            })
            // --- Filter by expected investment amount range ---
            ->when(!empty($expectedInvestmentAmount), function ($query) use ($expectedInvestmentAmount) {
                $query->whereHas('financialDetails', function ($q) use ($expectedInvestmentAmount) {
                    if (isset($expectedInvestmentAmount['min']) && is_numeric($expectedInvestmentAmount['min'])) {
                        $q->where('investment_budget->max', '>=', $expectedInvestmentAmount['min']);
                    }

                    if (isset($expectedInvestmentAmount['max']) && is_numeric($expectedInvestmentAmount['max'])) {
                        $q->where('investment_budget->min', '<=', $expectedInvestmentAmount['max']);
                    }
                });
            })
            // --- Filter by pinned status ---
            ->when($showOnlyPinned === '1', function ($query) {
                $query->where('pinned', true);
            })
            ->paginate(10);

        $data = ($search && $buyers->isEmpty()) ? [] : $buyers->items();

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $buyers->total(),
                'current_page' => $buyers->currentPage(),
                'last_page' => $buyers->lastPage(),
                'per_page' => $buyers->perPage(),
            ]
        ]);
    }

    public function drafts(Request $request)
    {
        $search = $request->input('search', '');
        $country = $request->input('country');
        $registeredAfter = $request->input('registered_after');
        $status = $request->input('status');
        $source = $request->input('source');
        $broaderIndustries = $request->input('broader_industries', []);
        $priorityIndustries = $request->input('priority_industries', []);
        $showOnlyPinned = $request->input('show_only_pinned');
        $sort = $request->input('sort');

        // --- Retrieve range-based parameters ---
        $acquisitionPreference = $request->input('acquisition_preference', []);
        $ebitdaRequirements = $request->input('ebitda_requirements', []);
        $expectedInvestmentAmount = $request->input('expected_investment_amount', []);


        $buyers = Buyer::with([
            'companyOverview',
            'targetPreference',
            'financialDetails',
            'partnershipDetails',
            'teaserCenter',
        ])
            ->where('status', 2)
            ->when($search, function ($query) use ($search) {
                $query->whereHas('companyOverview', function ($q) use ($search) {
                    $q->where('reg_name', 'like', "%{$search}%");
                });
            })
              // --- Filter by country ---
            ->when($country, function ($query) use ($country) {
                $query->whereHas('companyOverview', function ($q) use ($country) {
                    $q->where('hq_country', $country);
                });
            })
            // --- Filter by registration date ---
            ->when($registeredAfter, function ($query) use ($registeredAfter) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $registeredAfter, 'Asia/Dhaka')
                        ->endOfDay()
                        ->setTimezone('UTC');
                    $query->where('created_at', '<=', $date);
                } catch (\Exception $e) {
                    // Ignore invalid date format
                }
            })
            // --- Filter by status ---
            ->when(!empty($status), function ($query) use ($status) {
                $query->whereHas('companyOverview', function ($q) use ($status) {
                    $q->where('status', 'LIKE', trim($status));
                });
            })

            // --- Filter by source ---
            ->when($source, function ($query) use ($source) {
                $query->whereHas('partnershipDetails', function ($q) use ($source) {
                    $q->where('partnership_affiliation', $source);
                });
            })
            // --- Filter by broader target industries (JSON) ---
            ->when(!empty($broaderIndustries), function ($query) use ($broaderIndustries) {
                $query->whereHas('targetPreference', function ($q) use ($broaderIndustries) {
                    $q->where(function ($q2) use ($broaderIndustries) {
                        foreach ($broaderIndustries as $id) {
                            $q2->orWhere('target_industries', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            // --- Filter by priority target industries (JSON) ---
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('targetPreference', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhere('target_niche_industries', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })

            ->when(!empty($ebitdaRequirements), function ($query) use ($ebitdaRequirements) {
                $query->whereHas('financialDetails', function ($q) use ($ebitdaRequirements) {
                    if (isset($ebitdaRequirements['min']) && is_numeric($ebitdaRequirements['min'])) {
                        $q->where('expected_ebitda->max', '>=', $ebitdaRequirements['min']);
                    }

                    if (isset($ebitdaRequirements['max']) && is_numeric($ebitdaRequirements['max'])) {
                        $q->where('expected_ebitda->min', '<=', $ebitdaRequirements['max']);
                    }
                });
            })
            // --- Filter by expected investment amount range ---
            ->when(!empty($expectedInvestmentAmount), function ($query) use ($expectedInvestmentAmount) {
                $query->whereHas('financialDetails', function ($q) use ($expectedInvestmentAmount) {
                    if (isset($expectedInvestmentAmount['min']) && is_numeric($expectedInvestmentAmount['min'])) {
                        $q->where('investment_budget->max', '>=', $expectedInvestmentAmount['min']);
                    }

                    if (isset($expectedInvestmentAmount['max']) && is_numeric($expectedInvestmentAmount['max'])) {
                        $q->where('investment_budget->min', '<=', $expectedInvestmentAmount['max']);
                    }
                });
            })
            // --- Filter by pinned status ---
            ->when($showOnlyPinned === '1', function ($query) {
                $query->where('pinned', true);
            })
            ->paginate(10);

        $data = ($search && $buyers->isEmpty()) ? [] : $buyers->items();

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $buyers->total(),
                'current_page' => $buyers->currentPage(),
                'last_page' => $buyers->lastPage(),
                'per_page' => $buyers->perPage(),
            ]
        ]);
    }


    public function fromPartners(Request $request)
    {
        $search = $request->input('search', '');
        $country = $request->input('country');
        $registeredAfter = $request->input('registered_after');
        $status = $request->input('status');
        $source = $request->input('source');
        $broaderIndustries = $request->input('broader_industries', []);
        $priorityIndustries = $request->input('priority_industries', []);
        $showOnlyPinned = $request->input('show_only_pinned');
        $sort = $request->input('sort');

        // --- Retrieve range-based parameters ---
        $acquisitionPreference = $request->input('acquisition_preference', []);
        $ebitdaRequirements = $request->input('ebitda_requirements', []);
        $expectedInvestmentAmount = $request->input('expected_investment_amount', []);


        $buyers = Buyer::with([
            'companyOverview',
            'targetPreference',
            'financialDetails',
            'partnershipDetails.partner.partnerOverview',
            'teaserCenter',
        ])
            ->whereHas('partnershipDetails', function ($query) {
                $query->where('partnership_affiliation', 1);
            })
            ->when($search, function ($query) use ($search) {
                $query->whereHas('companyOverview', function ($q) use ($search) {
                    $q->where('reg_name', 'like', "%{$search}%");
                });
            })
              // --- Filter by country ---
            ->when($country, function ($query) use ($country) {
                $query->whereHas('companyOverview', function ($q) use ($country) {
                    $q->where('hq_country', $country);
                });
            })
            // --- Filter by registration date ---
            ->when($registeredAfter, function ($query) use ($registeredAfter) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $registeredAfter, 'Asia/Dhaka')
                        ->endOfDay()
                        ->setTimezone('UTC');
                    $query->where('created_at', '<=', $date);
                } catch (\Exception $e) {
                    // Ignore invalid date format
                }
            })
            // --- Filter by status ---
            ->when(!empty($status), function ($query) use ($status) {
                $query->whereHas('companyOverview', function ($q) use ($status) {
                    $q->where('status', 'LIKE', trim($status));
                });
            })

            // --- Filter by source ---
            ->when($source, function ($query) use ($source) {
                $query->whereHas('partnershipDetails', function ($q) use ($source) {
                    $q->where('partnership_affiliation', $source);
                });
            })
            // --- Filter by broader target industries (JSON) ---
            ->when(!empty($broaderIndustries), function ($query) use ($broaderIndustries) {
                $query->whereHas('targetPreference', function ($q) use ($broaderIndustries) {
                    $q->where(function ($q2) use ($broaderIndustries) {
                        foreach ($broaderIndustries as $id) {
                            $q2->orWhere('target_industries', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            // --- Filter by priority target industries (JSON) ---
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('targetPreference', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhere('target_niche_industries', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })

            ->when(!empty($ebitdaRequirements), function ($query) use ($ebitdaRequirements) {
                $query->whereHas('financialDetails', function ($q) use ($ebitdaRequirements) {
                    if (isset($ebitdaRequirements['min']) && is_numeric($ebitdaRequirements['min'])) {
                        $q->where('expected_ebitda->max', '>=', $ebitdaRequirements['min']);
                    }

                    if (isset($ebitdaRequirements['max']) && is_numeric($ebitdaRequirements['max'])) {
                        $q->where('expected_ebitda->min', '<=', $ebitdaRequirements['max']);
                    }
                });
            })
            // --- Filter by expected investment amount range ---
            ->when(!empty($expectedInvestmentAmount), function ($query) use ($expectedInvestmentAmount) {
                $query->whereHas('financialDetails', function ($q) use ($expectedInvestmentAmount) {
                    if (isset($expectedInvestmentAmount['min']) && is_numeric($expectedInvestmentAmount['min'])) {
                        $q->where('investment_budget->max', '>=', $expectedInvestmentAmount['min']);
                    }

                    if (isset($expectedInvestmentAmount['max']) && is_numeric($expectedInvestmentAmount['max'])) {
                        $q->where('investment_budget->min', '<=', $expectedInvestmentAmount['max']);
                    }
                });
            })
            // --- Filter by pinned status ---
            ->when($showOnlyPinned === '1', function ($query) {
                $query->where('pinned', true);
            })
            ->paginate(10);

        $data = ($search && $buyers->isEmpty()) ? [] : $buyers->items();

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $buyers->total(),
                'current_page' => $buyers->currentPage(),
                'last_page' => $buyers->lastPage(),
                'per_page' => $buyers->perPage(),
            ]
        ]);
    }
}
