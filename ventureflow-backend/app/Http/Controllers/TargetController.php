<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

namespace App\Http\Controllers;
use App\Models\Target;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\TargetsCompanyOverview;
use App\Models\TargetsFinancialDetail;
use App\Models\TargetsTeaserCenter;
use App\Models\Investor;
use App\Models\ActivityLog;
use App\Models\TargetsPartnershipDetail;
use App\Models\InvestorsCompanyOverview;
use Carbon\Carbon;
use App\Models\User; // Notification recipient
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Auth;
use App\Notifications\NewRegistrationNotification;
use App\Models\Deal;
use App\Jobs\ComputeMatchesJob;

class TargetController extends Controller
{
    /**
     * Lightweight fetch: returns all active sellers with just id, code, and name.
     * Used for "Introduced Projects" dropdown in Investor Registration.
     */
    public function fetchAll()
    {
        $sellers = Target::where(function($q) {
                $q->where('status', '1')->orWhereNull('status');
            })
            ->with(['companyOverview:id,reg_name'])
            ->select('id', 'seller_id', 'company_overview_id', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($s) {
                return [
                    'id'   => $s->id,
                    'code' => $s->seller_id,
                    'name' => $s->companyOverview->reg_name ?? '',
                ];
            });

        return response()->json(['data' => $sellers]);
    }

    /**
     * Return the min and max expected investment amount values across all sellers.
     * Used by the frontend range slider filter.
     */
    public function investmentRange()
    {
        $range = Cache::remember('seller_investment_range', 1800, function () {
            $rows = \DB::table('sellers_financial_details')
                ->whereNotNull('expected_investment_amount')
                ->where('expected_investment_amount', '!=', '')
                ->pluck('expected_investment_amount');

            $minVal = null;
            $maxVal = null;

            foreach ($rows as $raw) {
                $budget = is_string($raw) ? json_decode($raw, true) : (is_array($raw) ? $raw : null);
                if (!is_array($budget)) continue;

                $bMin = (isset($budget['min']) && is_numeric($budget['min'])) ? (float) $budget['min'] : null;
                $bMax = (isset($budget['max']) && is_numeric($budget['max'])) ? (float) $budget['max'] : null;

                if ($bMin !== null && ($minVal === null || $bMin < $minVal)) $minVal = $bMin;
                if ($bMax !== null && ($maxVal === null || $bMax > $maxVal)) $maxVal = $bMax;
            }

            return ['min' => $minVal ?? 0, 'max' => $maxVal ?? 100000000];
        });

        return response()->json($range);
    }

    /**
     * Return the min and max EBITDA values across all sellers.
     */
    public function ebitdaRange()
    {
        $range = Cache::remember('seller_ebitda_range', 1800, function () {
            $rows = \DB::table('sellers_financial_details')
                ->whereNotNull('ebitda_value')
                ->where('ebitda_value', '!=', '')
                ->pluck('ebitda_value');

            $minVal = null;
            $maxVal = null;

            foreach ($rows as $raw) {
                $ebitda = is_string($raw) ? json_decode($raw, true) : (is_array($raw) ? $raw : null);
                if (!is_array($ebitda)) continue;

                $eMin = (isset($ebitda['min']) && is_numeric($ebitda['min'])) ? (float) $ebitda['min'] : null;
                $eMax = (isset($ebitda['max']) && is_numeric($ebitda['max'])) ? (float) $ebitda['max'] : null;

                if ($eMin !== null && ($minVal === null || $eMin < $minVal)) $minVal = $eMin;
                if ($eMax !== null && ($maxVal === null || $eMax > $maxVal)) $maxVal = $eMax;
            }

            return ['min' => $minVal ?? 0, 'max' => $maxVal ?? 100000000];
        });

        return response()->json($range);
    }

    /**
     * Display a listing of the resource.
     */

    public function index(Request $request)
    {
        try {
        $search = $request->input('search', '');
        $country = $request->input('country');
        $registeredAfter = $request->input('registered_after');
        $registeredBefore = $request->input('registered_before');
        $pipelineStage = $request->input('pipeline_stage');
        $targetCountries = $request->input('target_countries', []);
        $structure = $request->input('structure');
        $status = $request->input('status');
        $source = $request->input('source');
        $currency = $request->input('currency');
        $annualRevenue = $request->input('annual_revenue');
        $dealTimeline = $request->input('deal_timeline');
        $broaderIndustries = $request->input('broader_industries', []);
        $priorityIndustries =  $request->input('priority_industries', []);
        $maxInvestorShareholdingPercentage = $request->input('maximum_investor_shareholding_percentage', '');
        $expectedInvestmentAmount = $request->input('expected_investment_amount', []);
        $showOnlyPinned = $request->input('show_only_pinned');
        $sort = $request->input('sort');
        $rank = $request->input('rank');
        $reasonMa = $request->input('reason_ma');
        $investmentCondition = $request->input('investment_condition');
        $ebitdaRange = $request->input('ebitda', []);
        $ebitdaTimes = $request->input('ebitda_times');

        // --- Currency-aware filtering ---
        $displayCurrencyCode = $request->input('display_currency');
        $displayRate = 1; // Default to USD (rate = 1)
        if ($displayCurrencyCode) {
            $displayCurrency = \App\Models\Currency::where('currency_code', $displayCurrencyCode)->first();
            if ($displayCurrency) {
                $displayRate = (float) $displayCurrency->exchange_rate ?: 1;
            }
        }

        $statusValue = $status !== null ? ($status == 1 ? '1' : '0') : null;

        // --- Check User Role ---
        $user = $request->user();
        $isPartner = $user && ($user->hasRole('partner') || $user->is_partner);

        $allowedFields = null;
        if ($isPartner) {
            $allowedFields = $this->getParsedAllowedFields('seller');
            // Partners see ALL targets (same as old PartnerDataController behavior)
            // Column-level filtering is handled below via $allowedFields
        }

        $query = Target::query();

        // --- Select Fields & Eager Load ---
        if ($isPartner && $allowedFields) {
             // Select allowed root fields + necessary foreign keys
             $rootFields = array_unique(array_merge(
                 ['id', 'pinned', 'created_at', 'status'], 
                 $allowedFields['root'],
                 [
                     'company_overview_id',
                     'financial_detail_id',
                     'partnership_detail_id',
                     'teaser_center_id',
                 ]
             ));
 
             $query->select($rootFields);

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
                // Hide sensitive deals for partners
                'deals' => function($q) use ($isPartner) {
                     $q->select('id', 'seller_id', 'stage_code', 'progress_percent', 'created_at');
                }
            ]);

        } else {
             // Admin: Load everything including hqCountry for country display
             $query->with([
                'companyOverview.hqCountry',
                'financialDetails',
                'partnershipDetails',
                'teaserCenter',
                'deals'
            ]);
        }

            // --- Filters ---
            $query->when($status === 'Draft', function ($query) {
                $query->where('status', 2);
            }, function ($query) use ($isPartner) {
                // Partners see ALL targets regardless of status (matching old partner portal)
                // Admins/Staff default to status=1 (Active)
                if (!$isPartner) {
                    $query->where('status', 1);
                }
            })
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('seller_id', 'like', "%{$search}%")
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
            ->when($registeredAfter, function ($query) use ($registeredAfter) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $registeredAfter, 'Asia/Dhaka')
                        ->startOfDay()
                        ->setTimezone('UTC');
                    $query->where('created_at', '>=', $date);
                } catch (\Exception $e) {
                    // ignore invalid date
                }
            })
            ->when($registeredBefore, function ($query) use ($registeredBefore) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $registeredBefore, 'Asia/Dhaka')
                        ->endOfDay()
                        ->setTimezone('UTC');
                    $query->where('created_at', '<=', $date);
                } catch (\Exception $e) {
                    // ignore invalid date
                }
            })
            // --- Filter by pipeline stage ---
            ->when($pipelineStage, function ($query) use ($pipelineStage) {
                $query->whereHas('deals', function ($q) use ($pipelineStage) {
                    $q->where('stage_code', $pipelineStage)->where('status', 'active');
                });
            })
            ->when(!empty($status), function ($query) use ($status) {
                $query->whereHas('companyOverview', function ($q) use ($status) {
                    $q->where('status', $status);
                });
            })
            ->when($source, function ($query) use ($source) {
                $query->whereHas('partnershipDetails', function ($q) use ($source) {
                    $q->where('partnership_affiliation', $source);
                });
            })
            ->when($currency, function ($query) use ($currency) {
                $query->whereHas('financialDetails', function ($q) use ($currency) {
                    $q->where('default_currency', $currency);
                });
            })
            ->when(!empty($broaderIndustries), function ($query) use ($broaderIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($broaderIndustries) {
                    $q->where(function ($q2) use ($broaderIndustries) {
                        foreach ($broaderIndustries as $id) {
                            // SQLite-compatible: match "id":N or "id": N in JSON array
                            $q2->orWhere('industry_ops', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            // SQLite-compatible: match "id":N in JSON array
                            $q2->orWhere('niche_industry', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            ->when(!empty($maxInvestorShareholdingPercentage), function ($query) use ($maxInvestorShareholdingPercentage) {
                $query->whereHas('financialDetails', function ($q) use ($maxInvestorShareholdingPercentage) {
                    $q->where('maximum_investor_shareholding_percentage', $maxInvestorShareholdingPercentage);
                });
            })
            // --- Filter by expected investment amount range (currency-aware, JSON {min, max}) ---
            ->when(!empty($expectedInvestmentAmount), function ($query) use ($expectedInvestmentAmount, $displayRate) {
                $query->whereHas('financialDetails', function ($q) use ($expectedInvestmentAmount, $displayRate) {
                    if (isset($expectedInvestmentAmount['min']) && is_numeric($expectedInvestmentAmount['min'])) {
                        $q->whereRaw(
                            'json_extract(expected_investment_amount, \'$.max\') IS NOT NULL AND json_extract(expected_investment_amount, \'$.max\') != \'\' AND CAST(json_extract(expected_investment_amount, \'$.max\') AS REAL) >= ? * COALESCE((SELECT exchange_rate FROM currencies WHERE id = sellers_financial_details.default_currency OR currency_code = sellers_financial_details.default_currency LIMIT 1), 1) / ?',
                            [$expectedInvestmentAmount['min'], $displayRate]
                        );
                    }
                    if (isset($expectedInvestmentAmount['max']) && is_numeric($expectedInvestmentAmount['max'])) {
                        $q->whereRaw(
                            'json_extract(expected_investment_amount, \'$.min\') IS NOT NULL AND json_extract(expected_investment_amount, \'$.min\') != \'\' AND CAST(json_extract(expected_investment_amount, \'$.min\') AS REAL) <= ? * COALESCE((SELECT exchange_rate FROM currencies WHERE id = sellers_financial_details.default_currency OR currency_code = sellers_financial_details.default_currency LIMIT 1), 1) / ?',
                            [$expectedInvestmentAmount['max'], $displayRate]
                        );
                    }
                });
            })
            ->when($showOnlyPinned === '1', function ($query) {
                $query->where('pinned', true);
            })
            // --- Filter by rank ---
            ->when($rank, function ($query) use ($rank) {
                $query->whereHas('companyOverview', function ($q) use ($rank) {
                    $q->where('company_rank', $rank);
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
                $query->whereHas('financialDetails', function ($q) use ($investmentCondition) {
                    $q->where('investment_condition', 'LIKE', '%' . $investmentCondition . '%');
                });
            })
            // --- Filter by EBITDA value range (currency-aware) ---
            ->when(!empty($ebitdaRange), function ($query) use ($ebitdaRange, $displayRate) {
                $query->whereHas('financialDetails', function ($q) use ($ebitdaRange, $displayRate) {
                    if (isset($ebitdaRange['min']) && is_numeric($ebitdaRange['min'])) {
                        $q->whereRaw(
                            'json_extract(ebitda_value, \'$.max\') IS NOT NULL AND json_extract(ebitda_value, \'$.max\') != \'\' AND CAST(json_extract(ebitda_value, \'$.max\') AS REAL) >= ? * COALESCE((SELECT exchange_rate FROM currencies WHERE id = sellers_financial_details.default_currency OR currency_code = sellers_financial_details.default_currency LIMIT 1), 1) / ?',
                            [$ebitdaRange['min'], $displayRate]
                        );
                    }
                    if (isset($ebitdaRange['max']) && is_numeric($ebitdaRange['max'])) {
                        $q->whereRaw(
                            'json_extract(ebitda_value, \'$.min\') IS NOT NULL AND json_extract(ebitda_value, \'$.min\') != \'\' AND CAST(json_extract(ebitda_value, \'$.min\') AS REAL) <= ? * COALESCE((SELECT exchange_rate FROM currencies WHERE id = sellers_financial_details.default_currency OR currency_code = sellers_financial_details.default_currency LIMIT 1), 1) / ?',
                            [$ebitdaRange['max'], $displayRate]
                        );
                    }
                });
            })
            // --- Filter by EBITDA times ---
            ->when($ebitdaTimes, function ($query) use ($ebitdaTimes) {
                $query->whereHas('financialDetails', function ($q) use ($ebitdaTimes) {
                    $q->where('ebitda_times', $ebitdaTimes);
                });
            });

        if ($sort) {
            $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
            $sortColumn = ltrim($sort, '-');
            if (in_array($sortColumn, ['created_at', 'seller_id', 'pinned'])) {
                $query->orderBy($sortColumn, $direction);
            }
        } else {
            $query->orderByDesc('pinned')->orderByDesc('created_at');
        }

        $perPage = $request->input('per_page', 10);
        $sellers = $query->paginate($perPage);
        $data = ($search && $sellers->isEmpty()) ? [] : $sellers->items();  

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $sellers->total(),
                'current_page' => $sellers->currentPage(),
                'last_page' => $sellers->lastPage(),
                'per_page' => $sellers->perPage(),
                'allowed_fields' => isset($allowedFields) ? $allowedFields : null,
            ]
        ]);
        } catch (\Throwable $e) {
             \Illuminate\Support\Facades\Log::error('Seller Index Error: ' . $e->getMessage());
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
                'root' => ['id'], 
                'relationships' => []
            ];

            if (!$setting || !is_array($setting->setting_value)) {
                \Illuminate\Support\Facades\Log::info("No partner sharing settings for type: {$type}");
                return $parsed;
            }

            $enabledFields = array_keys(array_filter($setting->setting_value, function($val) {
                return $val === true;
            }));

            // Field alias mapping: config names that don't match actual DB column names
            $fieldAliases = [
                'niche_tags' => 'niche_industry',
            ];

            foreach ($enabledFields as $field) {
                if (str_contains($field, '.')) {
                    $parts = explode('.', $field);
                    $relation = \Illuminate\Support\Str::camel($parts[0]);
                    $attribute = $fieldAliases[$parts[1]] ?? $parts[1];

                    if (!isset($parsed['relationships'][$relation])) {
                        $parsed['relationships'][$relation] = ['id'];
                    }
                    
                    $parsed['relationships'][$relation][] = $attribute;
                } else {
                    $parsed['root'][] = $fieldAliases[$field] ?? $field;
                }
            }

            return $parsed;
        });
    }







    public function checkId(Request $request)
    {
        $id = $request->input('id');
        $exclude = $request->input('exclude');

        $query = Target::where('seller_id', $id);

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
        $prefix = $countryAlpha . '-S-';

        try {
            $lastSeller = Target::where('seller_id', 'LIKE', $prefix . '%')
                ->select('seller_id')
                ->get()
                ->map(function ($item) use ($prefix) {
                    $numericPart = str_replace($prefix, '', $item->seller_id);
                    return (int) $numericPart;
                })
                ->max();

            $lastSequence = $lastSeller ? (int)$lastSeller : 0;

            return response()->json(['lastSequence' => $lastSequence]);
        } catch (\Exception $e) {
            \Log::error("Error fetching last sequence for country {$countryAlpha}: " . $e->getMessage());
            return response()->json(['error' => 'Could not retrieve sequence number.'], 500);
        }
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }


    public function sellerPartnershipDetailsStore(Request $request)
    {
        try {
            $target = Target::find($request->input('seller_id'));

            if (!$target) {
                return response()->json([
                    'message' => 'Seller not found.'
                ], 404);
            }


            if ($target->partnership_detail_id) {
                $partnershipDetail = TargetsPartnershipDetail::find($target->partnership_detail_id) ?? new TargetsPartnershipDetail();
            } else {
                $partnershipDetail = new TargetsPartnershipDetail();
            }


            $partnershipDetail->partner = $request->input('partner');
            $partnershipDetail->referral_bonus_criteria = $request->input('referral_bonus_criteria');
            $partnershipDetail->referral_bonus_amount = $request->input('referral_bonus_amount');
            $partnershipDetail->mou_status = $request->input('mou_status');
            $partnershipDetail->specific_remarks = $request->input('specific_remarks');


            $partnershipDetail->partnership_affiliation = (int) $request->input('partnership_affiliation', 0);

            $partnershipDetail->save();


            $target->partnership_detail_id = $partnershipDetail->id;
            $target->status = $request->input('is_draft') ?? '1';
            $target->save();

            return response()->json([
                'message' => 'Seller partnership details saved successfully.',
                'data' => $target->id,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error storing seller partnership details: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to store seller partnership details.',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function sellerCompanyOverviewstore(Request $request)
    {
        try {
            // Find existing seller
            $target = Target::find($request->seller_id);

            // Check if seller exists and has an existing company overview
            if ($target && $target->company_overview_id) {
                // Update existing overview
                $overview = TargetsCompanyOverview::find($target->company_overview_id);
            } else {
                // Create new overview
                $overview = new TargetsCompanyOverview();
            }

            // Set overview data
            $overview->reg_name = $request->input('companyName');
            $overview->hq_country = $request->input('hq_country') ?? (json_decode($request->input('originCountry'), true)['id'] ?? null);
            $overview->company_type = $request->input('companyType');
            $overview->year_founded = $request->input('yearFounded');
            $overview->niche_industry = json_decode($request->input('priorityIndustries'), true);
            $overview->email = $request->input('companyEmail');
            $overview->phone = $request->input('companyPhoneNumber');
            $overview->hq_address = json_decode($request->input('hq_address'), true);
            $overview->shareholder_name = $request->input('shareholder_name');
            $overview->seller_contact_name = $request->input('sellerSideContactPersonName');
            $overview->seller_designation = $request->input('designationAndPosition');
            $overview->seller_email = $request->input('emailAddress');
            $overview->seller_phone = json_decode($request->input('contactPersons'), true);
            $overview->contacts = json_decode($request->input('contactPersons'), true);
            $overview->website = $request->input('websiteLink');
            $overview->website_links = json_decode($request->input('website_links'), true);
            $overview->introduced_projects = json_decode($request->input('introduced_projects'), true);
            $overview->linkedin = $request->input('linkedinLink');
            $overview->twitter = $request->input('twitterLink');
            $overview->facebook = $request->input('facebookLink');
            $overview->instagram = $request->input('instagramLink');
            $overview->youtube = $request->input('youtubeLink');
            $overview->teaser_link = $request->input('teaser_link');
            $overview->synergies = $request->input('potentialSynergries');
            $overview->emp_full_time = $request->input('fullTimeEmployeeCounts');
            $overview->proj_start_date = $request->input('projectStartDate');
            $overview->txn_timeline = $request->input('expectedTransactionTimeline');
            $overview->industry_ops = json_decode($request->input('broderIndustries'), true);
            $overview->local_industry_code = $request->input('localIndustryCode');
            $overview->op_countries = json_decode($request->input('operationalCountries'), true);
            $overview->emp_total = $request->input('totalEmployeeCounts');
            $overview->company_rank = $request->input('companyRank');
            $overview->reason_ma = is_array($request->input('reason_for_mna')) ? implode(', ', $request->input('reason_for_mna')) : $request->input('reason_for_mna');
            $overview->no_pic_needed = $request->input('noPICNeeded');
            $overview->status = is_array($request->input('status')) ? implode(', ', $request->input('status')) : $request->input('status');
            $overview->details = $request->input('details');
            $overview->incharge_name = json_decode($request->input('our_person_incharge'), true);
            $overview->financial_advisor = json_decode($request->input('financial_advisor'), true);
            $overview->internal_pic = json_decode($request->input('internal_pic'), true);
            $overview->channel = $request->input('channel');




            // Save the overview
            $overview->save();

            // UNBREAKABLE: Final check for ID uniqueness
            $dealroomId = $request->input('dealroomId');
            if ($dealroomId) {
                $exists = Target::where('seller_id', $dealroomId)
                    ->when($target, function($q) use ($target) { $q->where('id', '!=', $target->id); })
                    ->exists();
                if ($exists) {
                    return response()->json(['message' => 'The Project Code is already in use.'], 422);
                }
            }

            // Create or update the seller record
            if (!$target) {
                $target = new Target();
                $target->seller_id = $dealroomId;
            }

            if ($request->hasFile('profilePicture')) {
                $path = $request->file('profilePicture')->store('seller_pics', 'public');
                $target->image = $path;
            }

            //$target->image = $overview->profile_picture ?? $target->image;
            $target->company_overview_id = $overview->id;
            $target->seller_id = $request->input('dealroomId');
            // Frontend sends 'Active' or 'Draft' in the 'status' field
            $statusVal = $request->input('status');
            if ($statusVal === 'Draft') {
                $target->status = '2';
            } elseif ($statusVal === 'Active') {
                $target->status = '1';
            } else {
                $target->status = $request->input('is_draft') ?? '1';
            }
            $target->save();

            // Add Activity Log
            ActivityLog::create([
                'user_id' => \Auth::id(),
                'loggable_id' => $target->id,
                'loggable_type' => Target::class,
                'type' => 'system',
                'content' => ($request->seller_id ? "Target profile updated: " : "New Target profile registered: ") . ($overview->reg_name ?? ''),
            ]);

            // MatchIQ: Compute matches in background
            try {
                ComputeMatchesJob::dispatch('seller', $target->id)->delay(5);
            } catch (\Exception $e) {
                Log::error('MatchIQ dispatch failed: ' . $e->getMessage());
            }

            // Notify System Admins if it's a new Target
            if (!$request->seller_id) {
                try {
                    $admins = User::role('System Admin')->get();
                    Notification::send($admins, new NewRegistrationNotification('Seller', $overview->reg_name ?? 'new Target', $target->id, Auth::user()));
                } catch (\Exception $e) {
                    Log::error('Notification failed: ' . $e->getMessage());
                }
            }

            return response()->json([
                'message' => 'Seller company overview saved successfully.',
                'data' => $target->id,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Company overview error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while saving the company overview.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function sellerFinancialDetailsstore(Request $request)
    {
        //Log::info('Request payload:', $request->input('seller_id'));

        try {
            $target = Target::find($request->input('seller_id'));

            if (!$target) {
                return response()->json([
                    'message' => 'Seller not found.',
                ], 404);
            }

            // Check if updating or creating new financial details
            if ($target->financial_detail_id) {
                $financialDetails = TargetsFinancialDetail::find($target->financial_detail_id);
                if (!$financialDetails) {
                    // Fallback: create new if referenced ID doesn't exist
                    $financialDetails = new TargetsFinancialDetail();
                }
            } else {
                $financialDetails = new TargetsFinancialDetail();
            }

            // Assign values
            $financialDetails->default_currency = $request->input('default_currency');
            $financialDetails->valuation_method = $request->input('valuation_method');
            $financialDetails->monthly_revenue = $request->input('monthly_revenue');
            $financialDetails->annual_revenue = $request->input('annual_revenue');
            $financialDetails->operating_profit = $request->input('operating_profit');
            $financialDetails->expected_investment_amount = $request->input('expected_investment_amount');
            $financialDetails->maximum_investor_shareholding_percentage = $request->input('maximum_investor_shareholding_percentage');
            $financialDetails->ebitda_value = $request->input('ebitda_value');
            $financialDetails->investment_condition = $request->input('investment_condition');
            $financialDetails->ebitda_details = $request->input('ebitda_details');

            // ebitda_times: accept either a simple numeric value or legacy JSON array
            $ebitdaTimesInput = $request->input('ebitda_times');
            if (is_numeric($ebitdaTimesInput)) {
                $financialDetails->ebitda_times = $ebitdaTimesInput;
            } elseif (is_array($ebitdaTimesInput)) {
                $financialDetails->ebitda_times = json_encode($ebitdaTimesInput);
            } else {
                $financialDetails->ebitda_times = $ebitdaTimesInput;
            }

            $financialDetails->save();

            // Link financial detail to seller if not already linked
            $target->financial_detail_id = $financialDetails->id;
            $target->status = $request->input('is_draft') ?? '1';
            $target->save();

            return response()->json([
                'message' => 'Seller financial details saved successfully.',
                'data' => $target->id,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Financial details error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while saving financial details.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function sellerTeaserCenterstore(Request $request)
    {
        try {
            $target = Target::find($request->input('seller_id'));

            if (!$target) {
                return response()->json([
                    'message' => 'Seller not found.'
                ], 404);
            }

            // Create or fetch teaser
            $teaser = $target->teaser_center_id
                ? TargetsTeaserCenter::find($target->teaser_center_id) ?? new TargetsTeaserCenter()
                : new TargetsTeaserCenter();

            // Assign standard fields
            $teaser->teaser_heading_name = $request->input('teaser_heading_name', '');
            $teaser->hq_origin_country_id = $request->input('hq_origin_country_id');
            $teaser->current_employee_count = $request->input('current_employee_count');
            $teaser->company_rank = $request->input('company_rank');
            $teaser->selling_reason = $request->input('selling_reason');
            $teaser->teaser_details = $request->input('teaser_details');

            $teaser->misp = $request->input('misp');
            $teaser->ma_structure = $request->input('ma_structure');

            // Numeric values
            $teaser->ebitda_value = is_numeric($request->input('ebitda_value')) ? $request->input('ebitda_value') : null;
            $teaser->monthly_revenue = is_numeric($request->input('monthly_revenue')) ? $request->input('monthly_revenue') : null;
            $teaser->expected_investment_amount = is_numeric($request->input('expected_investment_amount')) ? $request->input('expected_investment_amount') : null;

            // Year founded
            $yearFounded = $request->input('year_founded');
            $teaser->year_founded = (is_numeric($yearFounded) && strlen($yearFounded) === 4)
                ? (int)$yearFounded
                : null;

            // Industry (JSON or array)
            $industryInput = $request->input('industry');
            if (is_string($industryInput)) {
                $decoded = json_decode($industryInput, true);
                $teaser->industry = is_array($decoded) ? $decoded : [];
            } elseif (is_array($industryInput)) {
                $teaser->industry = $industryInput;
            } else {
                $teaser->industry = [];
            }

            // Boolean toggles
            $booleanFields = [
                'has_industry',
                'has_rank',
                'has_teaser_description',
                'has_hq_origin_country',
                'has_expected_investment',
                'has_year_founded',
                'has_emp_count',
                'has_selling_reason',
                'has_ma_structure',
                'has_teaser_name',
                'is_industry_checked',
            ];

            foreach ($booleanFields as $field) {
                $teaser->{$field} = $request->boolean($field);
            }

            $teaser->save();

            // Link seller if needed
            $target->teaser_center_id = $teaser->id;
            $target->status = $request->input('is_draft', '1');
            $target->save();

            return response()->json([
                'message' => 'Seller teaser center saved successfully.',
                'data' => $target->id,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Teaser center error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while saving teaser center.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }



    /**
     * Display the specified resource.
     */
    public function show(Target $seller)
    {
        $request = request();
        $user = $request->user();
        $isPartner = $user && ($user->hasRole('partner') || $user->is_partner);

        if ($isPartner) {
            $allowedFields = $this->getParsedAllowedFields('target');
            $query = Target::where('id', $seller->id);

            $rootFields = array_unique(array_merge(
                 ['id', 'seller_id', 'pinned', 'created_at', 'status', 'updated_at'], 
                 $allowedFields['root'] ?? [],
                 ['company_overview_id', 'financial_detail_id', 'partnership_detail_id', 'teaser_center_id']
            ));
            $query->select($rootFields);

            $query->with([
                'companyOverview' => function($q) use ($allowedFields) {
                    if (isset($allowedFields['relationships']['companyOverview'])) {
                        $q->select(array_merge(['id', 'hq_country'], $allowedFields['relationships']['companyOverview']));
                    } else { $q->select('id'); }
                    $q->with('hqCountry');
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
                     $q->select('id', 'seller_id', 'stage_code', 'progress_percent', 'created_at');
                }
            ]);

            $result = $query->first();

            if (!$result) {
                return response()->json(['message' => 'Seller not found or access denied.'], 404);
            }

            return response()->json([
                'data' => $result,
                'meta' => ['allowed_fields' => $allowedFields]
            ]);

        } else {
             $seller->load([
                'companyOverview.hqCountry',
                'financialDetails',
                'partnershipDetails',
                'teaserCenter',
                'deals.buyer.companyOverview'
            ]);

            // Format deals as introduced projects (paired buyers) for frontend
            $introducedProjects = $seller->deals->map(function ($deal) {
                $buyerName = 'Unknown Investor';
                $buyerCode = 'N/A';
                
                if ($deal->buyer && $deal->buyer->companyOverview) {
                    $buyerName = $deal->buyer->companyOverview->reg_name ?? 'Unknown Investor';
                }
                if ($deal->buyer) {
                    $buyerCode = $deal->buyer->buyer_id ?? 'N/A';
                }

                return [
                    'id' => $deal->buyer ? $deal->buyer->id : null,
                    'deal_id' => $deal->id,
                    'code' => $buyerCode,
                    'name' => $buyerName,
                    'stage_code' => $deal->stage_code,
                    'buyer_stage_name' => $deal->buyer_stage_name,
                    'seller_stage_name' => $deal->seller_stage_name,
                    'progress' => $deal->progress_percent,
                    'introduced_at' => $deal->created_at,
                ];
            });

            // Format activity logs
            $formattedLogs = $seller->activityLogs()
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(function ($log) {
                    $isSystem = str_starts_with($log->description ?? '', '[System]');
                    return [
                        'id' => $log->id,
                        'user_name' => $log->user_name,
                        'description' => $log->description,
                        'timestamp' => $log->created_at,
                        'isSystem' => $isSystem,
                        'metadata' => $log->metadata,
                    ];
                });

            $sellerData = $seller->toArray();
            $sellerData['formatted_activity_logs'] = $formattedLogs;
            $sellerData['formatted_introduced_projects'] = $introducedProjects;

            return response()->json([
                'data' => $sellerData
            ]);
        }
    }


    /**
     * Pinned/Unpinned
     */
    public function pinned(Target $seller)
    {
        try {
            $seller->pinned = !$seller->pinned;
            $seller->save();

            return response()->json([
                'message' => 'Seller pinned status updated successfully.',
                'data' => $seller,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error updating pinned status: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to update pinned status.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Target $seller)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Target $seller)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
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

            // Count how many buyers reference these sellers in their introduced_projects JSON
            $introducedProjectsCount = 0;
            $allBuyerOverviews = InvestorsCompanyOverview::whereNotNull('introduced_projects')->get();
            foreach ($allBuyerOverviews as $overview) {
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
                'deals' => Deal::whereIn('seller_id', $ids)->count(),
                'active_deals' => Deal::whereIn('seller_id', $ids)
                    ->where('progress_percent', '<', 100)
                    ->count(),
                'introduced_projects' => $introducedProjectsCount,
                'files' => 0, // File management removed in Phase 2
                'activities' => ActivityLog::where('loggable_type', Target::class)
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
                    'message' => 'No Seller IDs provided for deletion.'
                ], 400);
            }

            if (!is_array($idsToDelete)) {
                $idsToDelete = [$idsToDelete];
            }

            $deletedCount = 0;

            // Use a database transaction to ensure data integrity.
            DB::transaction(function () use ($idsToDelete, &$deletedCount) {
                // Fetch sellers to get related record IDs before they are deleted
                $sellers = Target::whereIn('id', $idsToDelete)->get();
                $overviewIds = $sellers->pluck('company_overview_id')->filter()->toArray();
                $financialIds = $sellers->pluck('financial_detail_id')->filter()->toArray();
                $partnershipIds = $sellers->pluck('partnership_detail_id')->filter()->toArray();
                $teaserIds = $sellers->pluck('teaser_center_id')->filter()->toArray();

                // 1. Delete polymorphic logs
                ActivityLog::where('loggable_type', Target::class)
                    ->whereIn('loggable_id', $idsToDelete)
                    ->delete();

                // 2. File management was removed in Phase 2 — no file cleanup needed

                // 3. Clean up introduced_projects references from buyers' company overviews
                // When a seller is deleted, any buyer that references this seller in their
                // introduced_projects JSON must have that reference removed.
                $intIdsToDelete = array_map('intval', $idsToDelete);
                $buyerOverviews = InvestorsCompanyOverview::whereNotNull('introduced_projects')->get();
                foreach ($buyerOverviews as $buyerOverview) {
                    $projects = is_array($buyerOverview->introduced_projects) ? $buyerOverview->introduced_projects : json_decode($buyerOverview->introduced_projects, true);
                    if (!is_array($projects)) continue;
                    $filtered = array_values(array_filter($projects, function ($project) use ($intIdsToDelete) {
                        return !isset($project['id']) || !in_array((int)$project['id'], $intIdsToDelete);
                    }));
                    if (count($filtered) !== count($projects)) {
                        $buyerOverview->introduced_projects = $filtered;
                        $buyerOverview->save();
                    }
                }

                // 4. Delete the sellers
                $deletedCount = Target::whereIn('id', $idsToDelete)->delete();

                // 5. Clean up the detailed records (orphaned after seller is deleted)
                if (!empty($overviewIds)) {
                    TargetsCompanyOverview::whereIn('id', $overviewIds)->delete();
                }
                if (!empty($financialIds)) {
                    TargetsFinancialDetail::whereIn('id', $financialIds)->delete();
                }
                if (!empty($partnershipIds)) {
                    TargetsPartnershipDetail::whereIn('id', $partnershipIds)->delete();
                }
                if (!empty($teaserIds)) {
                    TargetsTeaserCenter::whereIn('id', $teaserIds)->delete();
                }
            });

            if ($deletedCount > 0) {
                $message = $deletedCount === 1
                    ? 'Target and all related data deleted successfully.'
                    : $deletedCount . ' targets and all related data deleted successfully.';
                return response()->json([
                    'message' => $message
                ], 200);
            } else {
                return response()->json([
                    'message' => 'No targets found with the provided IDs.'
                ], 404);
            }
        } catch (\Exception $e) {
            Log::error('Error deleting seller(s): ' . $e->getMessage(), [
                'exception' => $e,
                'ids_provided' => $request->input('ids')
            ]);
            return response()->json([
                'message' => 'Failed to delete target(s).',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function pinnedData(Request $request)
    {
        $search = $request->input('search', '');

        $country = $request->input('country');
        $registeredAfter = $request->input('registered_after');
        $structure = $request->input('structure');
        $status = $request->input('status');
        $source = $request->input('source');
        $currency = $request->input('currency');
        $annualRevenue = $request->input('annual_revenue');
        $dealTimeline = $request->input('deal_timeline');
        $broaderIndustries = $request->input('broader_industries', '');
        $priorityIndustries =  $request->input('priority_industries', '');
        $maxInvestorShareholdingPercentage = $request->input('maximum_investor_shareholding_percentage', '');
        $expectedInvestmentAmount = $request->input('expected_investment_amount', '');
        $showOnlyPinned = $request->input('show_only_pinned');
        $sort = $request->input('sort');

        $sellers = Target::with([
            'companyOverview',
            'financialDetails',
            'partnershipDetails',
            'teaserCenter',
        ])
            ->whereHas('companyOverview', function ($query) {
                $query->whereIn('status', ['Active', 'In Progress', 'Interested']);
            })
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('seller_id', 'like', "%{$search}%")
                        ->orWhereHas('companyOverview', function ($q) use ($search) {
                            $q->where('reg_name', 'like', "%{$search}%");
                        });
                });
            })
            //The when Start
             ->when($country, function ($query) use ($country) {
                $query->whereHas('companyOverview', function ($q) use ($country) {
                    $q->where('hq_country', $country);
                });
            })
            ->when($registeredAfter, function ($query) use ($registeredAfter) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $registeredAfter, 'Asia/Dhaka')
                        ->endOfDay()
                        ->setTimezone('UTC');
                    $query->where('created_at', '<=', $date);
                } catch (\Exception $e) {
                    // ignore invalid date
                }
            })
            ->when(!empty($status), function ($query) use ($status) {
                $query->whereHas('companyOverview', function ($q) use ($status) {
                    $q->where('status', $status);
                });
            })
            ->when($source, function ($query) use ($source) {
                $query->whereHas('partnershipDetails', function ($q) use ($source) {
                    $q->where('partnership_affiliation', $source);
                });
            })
            ->when($currency, function ($query) use ($currency) {
                $query->whereHas('financialDetails', function ($q) use ($currency) {
                    $q->where('default_currency', $currency);
                });
            })
            ->when(!empty($broaderIndustries), function ($query) use ($broaderIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($broaderIndustries) {
                    $q->where(function ($q2) use ($broaderIndustries) {
                        foreach ($broaderIndustries as $id) {
                            $q2->orWhere('industry_ops', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhere('niche_industry', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            ->when(!empty($maxInvestorShareholdingPercentage), function ($query) use ($maxInvestorShareholdingPercentage) {
                $query->whereHas('financialDetails', function ($q) use ($maxInvestorShareholdingPercentage) {
                    $q->where('maximum_investor_shareholding_percentage', $maxInvestorShareholdingPercentage);
                });
            })
            ->when(!empty($expectedInvestmentAmount), function ($query) use ($expectedInvestmentAmount) {
                $query->whereHas('financialDetails', function ($q) use ($expectedInvestmentAmount) {
                    $q->where('expected_investment_amount', $expectedInvestmentAmount);
                });
            })
            ->when($showOnlyPinned === '1', function ($query) {
                $query->where('pinned', true);
            })
            //The when End
            ->paginate(10);

        $data = ($search && $sellers->isEmpty()) ? [] : $sellers->items();

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $sellers->total(),
                'current_page' => $sellers->currentPage(),
                'last_page' => $sellers->lastPage(),
                'per_page' => $sellers->perPage(),
            ]
        ]);
    }


    public function unpinnedData(Request $request)
    {
        $search = $request->input('search', '');


        $country = $request->input('country');
        $registeredAfter = $request->input('registered_after');
        $structure = $request->input('structure');
        $status = $request->input('status');
        $source = $request->input('source');
        $currency = $request->input('currency');
        $annualRevenue = $request->input('annual_revenue');
        $dealTimeline = $request->input('deal_timeline');
        $broaderIndustries = $request->input('broader_industries', '');
        $priorityIndustries =  $request->input('priority_industries', '');
        $maxInvestorShareholdingPercentage = $request->input('maximum_investor_shareholding_percentage', '');
        $expectedInvestmentAmount = $request->input('expected_investment_amount', '');
        $showOnlyPinned = $request->input('show_only_pinned');
        $sort = $request->input('sort');

        $sellers = Target::with([
            'companyOverview',
            'financialDetails',
            'partnershipDetails',
            'teaserCenter',
        ])
            ->whereHas('companyOverview', function ($query) {
                $query->whereIn('status', ['Not Interested', 'Canceled', 'In-Active']);
            })
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('seller_id', 'like', "%{$search}%")
                        ->orWhereHas('companyOverview', function ($q) use ($search) {
                            $q->where('reg_name', 'like', "%{$search}%");
                        });
                });
            })
              //The when Start
             ->when($country, function ($query) use ($country) {
                $query->whereHas('companyOverview', function ($q) use ($country) {
                    $q->where('hq_country', $country);
                });
            })
            ->when($registeredAfter, function ($query) use ($registeredAfter) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $registeredAfter, 'Asia/Dhaka')
                        ->endOfDay()
                        ->setTimezone('UTC');
                    $query->where('created_at', '<=', $date);
                } catch (\Exception $e) {
                    // ignore invalid date
                }
            })
            ->when(!empty($status), function ($query) use ($status) {
                $query->whereHas('companyOverview', function ($q) use ($status) {
                    $q->where('status', $status);
                });
            })
            ->when($source, function ($query) use ($source) {
                $query->whereHas('partnershipDetails', function ($q) use ($source) {
                    $q->where('partnership_affiliation', $source);
                });
            })
            ->when($currency, function ($query) use ($currency) {
                $query->whereHas('financialDetails', function ($q) use ($currency) {
                    $q->where('default_currency', $currency);
                });
            })
            ->when(!empty($broaderIndustries), function ($query) use ($broaderIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($broaderIndustries) {
                    $q->where(function ($q2) use ($broaderIndustries) {
                        foreach ($broaderIndustries as $id) {
                            $q2->orWhere('industry_ops', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhere('niche_industry', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            ->when(!empty($maxInvestorShareholdingPercentage), function ($query) use ($maxInvestorShareholdingPercentage) {
                $query->whereHas('financialDetails', function ($q) use ($maxInvestorShareholdingPercentage) {
                    $q->where('maximum_investor_shareholding_percentage', $maxInvestorShareholdingPercentage);
                });
            })
            ->when(!empty($expectedInvestmentAmount), function ($query) use ($expectedInvestmentAmount) {
                $query->whereHas('financialDetails', function ($q) use ($expectedInvestmentAmount) {
                    $q->where('expected_investment_amount', $expectedInvestmentAmount);
                });
            })
            ->when($showOnlyPinned === '1', function ($query) {
                $query->where('pinned', true);
            })
            //The when End
            ->paginate(10);

        $data = ($search && $sellers->isEmpty()) ? [] : $sellers->items();

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $sellers->total(),
                'current_page' => $sellers->currentPage(),
                'last_page' => $sellers->lastPage(),
                'per_page' => $sellers->perPage(),
            ]
        ]);
    }


    public function closedDeals(Request $request)
    {
        $search = $request->input('search', '');
        $country = $request->input('country');
        $registeredAfter = $request->input('registered_after');
        $structure = $request->input('structure');
        $status = $request->input('status');
        $source = $request->input('source');
        $currency = $request->input('currency');
        $annualRevenue = $request->input('annual_revenue');
        $dealTimeline = $request->input('deal_timeline');
        $broaderIndustries = $request->input('broader_industries', '');
        $priorityIndustries =  $request->input('priority_industries', '');
        $maxInvestorShareholdingPercentage = $request->input('maximum_investor_shareholding_percentage', '');
        $expectedInvestmentAmount = $request->input('expected_investment_amount', '');
        $showOnlyPinned = $request->input('show_only_pinned');
        $sort = $request->input('sort');

        $sellers = Target::with([
            'companyOverview',
            'financialDetails',
            'partnershipDetails',
            'teaserCenter',
        ])
            ->whereHas('companyOverview', function ($query) {
                $query->where('status', 'Deal Closed');
            })
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('seller_id', 'like', "%{$search}%")
                        ->orWhereHas('companyOverview', function ($q) use ($search) {
                            $q->where('reg_name', 'like', "%{$search}%");
                        });
                });
            })
                //The when Start
             ->when($country, function ($query) use ($country) {
                $query->whereHas('companyOverview', function ($q) use ($country) {
                    $q->where('hq_country', $country);
                });
            })
            ->when($registeredAfter, function ($query) use ($registeredAfter) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $registeredAfter, 'Asia/Dhaka')
                        ->endOfDay()
                        ->setTimezone('UTC');
                    $query->where('created_at', '<=', $date);
                } catch (\Exception $e) {
                    // ignore invalid date
                }
            })
            ->when(!empty($status), function ($query) use ($status) {
                $query->whereHas('companyOverview', function ($q) use ($status) {
                    $q->where('status', $status);
                });
            })
            ->when($source, function ($query) use ($source) {
                $query->whereHas('partnershipDetails', function ($q) use ($source) {
                    $q->where('partnership_affiliation', $source);
                });
            })
            ->when($currency, function ($query) use ($currency) {
                $query->whereHas('financialDetails', function ($q) use ($currency) {
                    $q->where('default_currency', $currency);
                });
            })
            ->when(!empty($broaderIndustries), function ($query) use ($broaderIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($broaderIndustries) {
                    $q->where(function ($q2) use ($broaderIndustries) {
                        foreach ($broaderIndustries as $id) {
                            $q2->orWhere('industry_ops', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhere('niche_industry', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            ->when(!empty($maxInvestorShareholdingPercentage), function ($query) use ($maxInvestorShareholdingPercentage) {
                $query->whereHas('financialDetails', function ($q) use ($maxInvestorShareholdingPercentage) {
                    $q->where('maximum_investor_shareholding_percentage', $maxInvestorShareholdingPercentage);
                });
            })
            ->when(!empty($expectedInvestmentAmount), function ($query) use ($expectedInvestmentAmount) {
                $query->whereHas('financialDetails', function ($q) use ($expectedInvestmentAmount) {
                    $q->where('expected_investment_amount', $expectedInvestmentAmount);
                });
            })
            ->when($showOnlyPinned === '1', function ($query) {
                $query->where('pinned', true);
            })
            //The when End
            ->paginate(10);

        $data = ($search && $sellers->isEmpty()) ? [] : $sellers->items();

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $sellers->total(),
                'current_page' => $sellers->currentPage(),
                'last_page' => $sellers->lastPage(),
                'per_page' => $sellers->perPage(),
            ]
        ]);
    }


    public function drafts(Request $request)
    {
        $search = $request->input('search', '');
        $country = $request->input('country');
        $registeredAfter = $request->input('registered_after');
        $structure = $request->input('structure');
        $status = $request->input('status');
        $source = $request->input('source');
        $currency = $request->input('currency');
        $annualRevenue = $request->input('annual_revenue');
        $dealTimeline = $request->input('deal_timeline');
        $broaderIndustries = $request->input('broader_industries', '');
        $priorityIndustries =  $request->input('priority_industries', '');
        $maxInvestorShareholdingPercentage = $request->input('maximum_investor_shareholding_percentage', '');
        $expectedInvestmentAmount = $request->input('expected_investment_amount', '');
        $showOnlyPinned = $request->input('show_only_pinned');
        $sort = $request->input('sort');

        $sellers = Target::with([
            'companyOverview',
            'financialDetails',
            'partnershipDetails',
            'teaserCenter',
        ])
            ->where('status', 2)
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('seller_id', 'like', "%{$search}%")
                        ->orWhereHas('companyOverview', function ($q) use ($search) {
                            $q->where('reg_name', 'like', "%{$search}%");
                        });
                });
            })
                //The when Start
             ->when($country, function ($query) use ($country) {
                $query->whereHas('companyOverview', function ($q) use ($country) {
                    $q->where('hq_country', $country);
                });
            })
            ->when($registeredAfter, function ($query) use ($registeredAfter) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $registeredAfter, 'Asia/Dhaka')
                        ->endOfDay()
                        ->setTimezone('UTC');
                    $query->where('created_at', '<=', $date);
                } catch (\Exception $e) {
                    // ignore invalid date
                }
            })
            ->when(!empty($status), function ($query) use ($status) {
                $query->whereHas('companyOverview', function ($q) use ($status) {
                    $q->where('status', $status);
                });
            })
            ->when($source, function ($query) use ($source) {
                $query->whereHas('partnershipDetails', function ($q) use ($source) {
                    $q->where('partnership_affiliation', $source);
                });
            })
            ->when($currency, function ($query) use ($currency) {
                $query->whereHas('financialDetails', function ($q) use ($currency) {
                    $q->where('default_currency', $currency);
                });
            })
            ->when(!empty($broaderIndustries), function ($query) use ($broaderIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($broaderIndustries) {
                    $q->where(function ($q2) use ($broaderIndustries) {
                        foreach ($broaderIndustries as $id) {
                            $q2->orWhere('industry_ops', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhere('niche_industry', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            ->when(!empty($maxInvestorShareholdingPercentage), function ($query) use ($maxInvestorShareholdingPercentage) {
                $query->whereHas('financialDetails', function ($q) use ($maxInvestorShareholdingPercentage) {
                    $q->where('maximum_investor_shareholding_percentage', $maxInvestorShareholdingPercentage);
                });
            })
            ->when(!empty($expectedInvestmentAmount), function ($query) use ($expectedInvestmentAmount) {
                $query->whereHas('financialDetails', function ($q) use ($expectedInvestmentAmount) {
                    $q->where('expected_investment_amount', $expectedInvestmentAmount);
                });
            })
            ->when($showOnlyPinned === '1', function ($query) {
                $query->where('pinned', true);
            })
            //The when End
            ->paginate(10);

        $data = ($search && $sellers->isEmpty()) ? [] : $sellers->items();

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $sellers->total(),
                'current_page' => $sellers->currentPage(),
                'last_page' => $sellers->lastPage(),
                'per_page' => $sellers->perPage(),
            ]
        ]);
    }

    public function partnerships(Request $request)
    {
        $search = $request->input('search', '');
        $country = $request->input('country');
        $registeredAfter = $request->input('registered_after');
        $structure = $request->input('structure');
        $status = $request->input('status');
        $source = $request->input('source');
        $currency = $request->input('currency');
        $annualRevenue = $request->input('annual_revenue');
        $dealTimeline = $request->input('deal_timeline');
        $broaderIndustries = $request->input('broader_industries', '');
        $priorityIndustries =  $request->input('priority_industries', '');
        $maxInvestorShareholdingPercentage = $request->input('maximum_investor_shareholding_percentage', '');
        $expectedInvestmentAmount = $request->input('expected_investment_amount', '');
        $showOnlyPinned = $request->input('show_only_pinned');
        $sort = $request->input('sort');

        $sellers = Target::with([
            'companyOverview',
            'financialDetails',
            'partnershipDetails',
            'teaserCenter',
            'partnershipDetails.partner.partnerOverview',
        ])
            ->whereHas('partnershipDetails', function ($query) {
                $query->where('partnership_affiliation', 1);
            })
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('seller_id', 'like', "%{$search}%")
                        ->orWhereHas('companyOverview', function ($q) use ($search) {
                            $q->where('reg_name', 'like', "%{$search}%");
                        });
                });
            })
                //The when Start
             ->when($country, function ($query) use ($country) {
                $query->whereHas('companyOverview', function ($q) use ($country) {
                    $q->where('hq_country', $country);
                });
            })
            ->when($registeredAfter, function ($query) use ($registeredAfter) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $registeredAfter, 'Asia/Dhaka')
                        ->endOfDay()
                        ->setTimezone('UTC');
                    $query->where('created_at', '<=', $date);
                } catch (\Exception $e) {
                    // ignore invalid date
                }
            })
            ->when(!empty($status), function ($query) use ($status) {
                $query->whereHas('companyOverview', function ($q) use ($status) {
                    $q->where('status', $status);
                });
            })
            ->when($source, function ($query) use ($source) {
                $query->whereHas('partnershipDetails', function ($q) use ($source) {
                    $q->where('partnership_affiliation', $source);
                });
            })
            ->when($currency, function ($query) use ($currency) {
                $query->whereHas('financialDetails', function ($q) use ($currency) {
                    $q->where('default_currency', $currency);
                });
            })
            ->when(!empty($broaderIndustries), function ($query) use ($broaderIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($broaderIndustries) {
                    $q->where(function ($q2) use ($broaderIndustries) {
                        foreach ($broaderIndustries as $id) {
                            $q2->orWhere('industry_ops', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhere('niche_industry', 'LIKE', '%"id":' . intval($id) . '%');
                        }
                    });
                });
            })
            ->when(!empty($maxInvestorShareholdingPercentage), function ($query) use ($maxInvestorShareholdingPercentage) {
                $query->whereHas('financialDetails', function ($q) use ($maxInvestorShareholdingPercentage) {
                    $q->where('maximum_investor_shareholding_percentage', $maxInvestorShareholdingPercentage);
                });
            })
            ->when(!empty($expectedInvestmentAmount), function ($query) use ($expectedInvestmentAmount) {
                $query->whereHas('financialDetails', function ($q) use ($expectedInvestmentAmount) {
                    $q->where('expected_investment_amount', $expectedInvestmentAmount);
                });
            })
            ->when($showOnlyPinned === '1', function ($query) {
                $query->where('pinned', true);
            })
            //The when End
            ->paginate(10);

        $data = ($search && $sellers->isEmpty()) ? [] : $sellers->items();

        return response()->json([
            'data' => $data,
            'meta' => [
                'total' => $sellers->total(),
                'current_page' => $sellers->currentPage(),
                'last_page' => $sellers->lastPage(),
                'per_page' => $sellers->perPage(),
            ]
        ]);
    }

    /**
     * POST /api/seller/{id}/avatar
     * Upload or replace the avatar image for a target.
     */
    public function uploadAvatar(Request $request, string $id)
    {
        $request->validate([
            'image' => 'required|image|max:2048',
        ]);

        $target = Target::findOrFail($id);
        $imagePath = $request->file('image')->store('sellers', 'public');
        $target->update(['image' => $imagePath]);

        return response()->json([
            'message'    => 'Avatar updated successfully.',
            'image_path' => $imagePath,
            'image_url'  => url('/api/files/' . $imagePath),
        ]);
    }
}
