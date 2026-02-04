<?php
namespace App\Http\Controllers;
use App\Models\Seller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\SellersCompanyOverview;
use App\Models\SellersFinancialDetail;
use App\Models\SellersTeaserCenter;
use App\Models\Buyer;
use App\Models\ActivityLog;
use App\Models\SellersPartnershipDetail;
use App\Models\FileFolder;
use Carbon\Carbon;
use App\Models\User; // Notification recipient
use Illuminate\Support\Facades\Notification;
use App\Notifications\NewRegistrationNotification;
use App\Models\Deal;

class SellerController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    public function index(Request $request)
    {
        try {
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

        $statusValue = $status !== null ? ($status == 1 ? '1' : '0') : null;

        // --- Check User Role ---
        $user = $request->user();
        $isPartner = $user && ($user->hasRole('partner') || $user->is_partner);

        $allowedFields = null;
        $partnerId = null;
        if ($isPartner) {
            $allowedFields = $this->getParsedAllowedFields('seller');
            // Get the partner_id from the user's associated partner record
            $partnerId = $user->partner_id ?? $user->partner?->id ?? null;
        }

        $query = Seller::query();

        // --- Partner Filtering: Only show prospects assigned to this partner ---
        if ($isPartner && $partnerId) {
            $query->whereHas('partnershipDetails', function ($q) use ($partnerId) {
                $q->where('partner', $partnerId);
            });
        }

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
                        $q->select(array_merge(['id'], $allowedFields['relationships']['companyOverview']));
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
                // Hide sensitive deals for partners
                'deals' => function($q) use ($isPartner) {
                     $q->select('id', 'seller_id', 'stage_code', 'progress_percent', 'created_at');
                }
            ]);

        } else {
             $query->with([
                'companyOverview',
                'financialDetails',
                'partnershipDetails',
                'teaserCenter',
                'deals'
            ]);
        }

            // --- Filters ---
            $query->when($status === 'Draft', function ($query) {
                $query->where('status', 2);
            }, function ($query) {
                $query->where('status', 1);
            })
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('seller_id', 'like', "%{$search}%")
                        ->orWhereHas('companyOverview', function ($q) use ($search) {
                            $q->where('reg_name', 'like', "%{$search}%");
                        });
                });
            })
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
                            $q2->orWhereRaw('JSON_CONTAINS(JSON_EXTRACT(industry_ops, "$[*].id"), CAST(? AS JSON))', [$id]);
                        }
                    });
                });
            })
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhereRaw('JSON_CONTAINS(JSON_EXTRACT(niche_industry, "$[*].id"), CAST(? AS JSON))', [$id]);
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

        foreach ($enabledFields as $field) {
            if (str_contains($field, '.')) {
                $parts = explode('.', $field);
                $relation = \Illuminate\Support\Str::camel($parts[0]);
                $attribute = $parts[1];

                if (!isset($parsed['relationships'][$relation])) {
                    $parsed['relationships'][$relation] = ['id'];
                }
                
                $parsed['relationships'][$relation][] = $attribute;
            } else {
                $parsed['root'][] = $field;
            }
        }

        return $parsed;
    }







    public function checkId(Request $request)
    {
        $id = $request->input('id');
        $exclude = $request->input('exclude');

        $query = Seller::where('seller_id', $id);

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
            $lastSeller = Seller::where('seller_id', 'LIKE', $prefix . '%')
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
            $seller = Seller::find($request->input('seller_id'));

            if (!$seller) {
                return response()->json([
                    'message' => 'Seller not found.'
                ], 404);
            }


            if ($seller->partnership_detail_id) {
                $partnershipDetail = SellersPartnershipDetail::find($seller->partnership_detail_id) ?? new SellersPartnershipDetail();
            } else {
                $partnershipDetail = new SellersPartnershipDetail();
            }


            $partnershipDetail->partner = $request->input('partner');
            $partnershipDetail->referral_bonus_criteria = $request->input('referral_bonus_criteria');
            $partnershipDetail->referral_bonus_amount = $request->input('referral_bonus_amount');
            $partnershipDetail->mou_status = $request->input('mou_status');
            $partnershipDetail->specific_remarks = $request->input('specific_remarks');


            $partnershipDetail->partnership_affiliation = (int) $request->input('partnership_affiliation', 0);

            $partnershipDetail->save();


            $seller->partnership_detail_id = $partnershipDetail->id;
            $seller->status = $request->input('is_draft') ?? '1';
            $seller->save();

            return response()->json([
                'message' => 'Seller partnership details saved successfully.',
                'data' => $seller->id,
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
            $seller = Seller::find($request->seller_id);

            // Check if seller exists and has an existing company overview
            if ($seller && $seller->company_overview_id) {
                // Update existing overview
                $overview = SellersCompanyOverview::find($seller->company_overview_id);
            } else {
                // Create new overview
                $overview = new SellersCompanyOverview();
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
            $overview->website = $request->input('websiteLink');
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
                $exists = Seller::where('seller_id', $dealroomId)
                    ->when($seller, function($q) use ($seller) { $q->where('id', '!=', $seller->id); })
                    ->exists();
                if ($exists) {
                    return response()->json(['message' => 'The project code (Dealroom ID) is already in use.'], 422);
                }
            }

            // Create or update the seller record
            if (!$seller) {
                $seller = new Seller();
                $seller->seller_id = $dealroomId;
            }

            if ($request->hasFile('profilePicture')) {
                $path = $request->file('profilePicture')->store('seller_pics', 'public');
                $seller->image = $path;
            }

            //$seller->image = $overview->profile_picture ?? $seller->image;
            $seller->company_overview_id = $overview->id;
            $seller->seller_id = $request->input('dealroomId');
            $seller->status = $request->input('is_draft') ?? '1'; // Default to 'active' if not provided
            $seller->save();

            // Add Activity Log
            ActivityLog::create([
                'user_id' => \Auth::id(),
                'loggable_id' => $seller->id,
                'loggable_type' => Seller::class,
                'type' => 'system',
                'content' => ($request->seller_id ? "Target profile updated: " : "New Target profile registered: ") . ($overview->reg_name ?? ''),
            ]);

            // Notify System Admins if it's a new seller
            if (!$request->seller_id) {
                try {
                    $admins = User::role('System Admin')->get();
                    Notification::send($admins, new NewRegistrationNotification('Seller', $overview->reg_name ?? 'New Seller', $seller->id));
                } catch (\Exception $e) {
                    Log::error('Notification failed: ' . $e->getMessage());
                }
            }

            return response()->json([
                'message' => 'Seller company overview saved successfully.',
                'data' => $seller->id,
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
            $seller = Seller::find($request->input('seller_id'));

            if (!$seller) {
                return response()->json([
                    'message' => 'Seller not found.',
                ], 404);
            }

            // Check if updating or creating new financial details
            if ($seller->financial_detail_id) {
                $financialDetails = SellersFinancialDetail::find($seller->financial_detail_id);
                if (!$financialDetails) {
                    // Fallback: create new if referenced ID doesn't exist
                    $financialDetails = new SellersFinancialDetail();
                }
            } else {
                $financialDetails = new SellersFinancialDetail();
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



            // $financialDetails->ebitda_times = $request->input('ebitda_times');
            if (is_array($request->input('ebitda_times'))) {
                $financialDetails->ebitda_times = json_encode($request->input('ebitda_times'));
            }

            $financialDetails->save();

            // Link financial detail to seller if not already linked
            $seller->financial_detail_id = $financialDetails->id;
            $seller->status = $request->input('is_draft') ?? '1';
            $seller->save();

            return response()->json([
                'message' => 'Seller financial details saved successfully.',
                'data' => $seller->id,
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
            $seller = Seller::find($request->input('seller_id'));

            if (!$seller) {
                return response()->json([
                    'message' => 'Seller not found.'
                ], 404);
            }

            // Create or fetch teaser
            $teaser = $seller->teaser_center_id
                ? SellersTeaserCenter::find($seller->teaser_center_id) ?? new SellersTeaserCenter()
                : new SellersTeaserCenter();

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
            $seller->teaser_center_id = $teaser->id;
            $seller->status = $request->input('is_draft', '1');
            $seller->save();

            return response()->json([
                'message' => 'Seller teaser center saved successfully.',
                'data' => $seller->id,
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
    public function show(Seller $seller)
    {
        $request = request();
        $user = $request->user();
        $isPartner = $user && ($user->hasRole('partner') || $user->is_partner);

        if ($isPartner) {
            $allowedFields = $this->getParsedAllowedFields('target');
            $query = Seller::where('id', $seller->id);

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
                'deals'
            ]);

            return response()->json([
                'data' => $seller
            ]);
        }
    }


    /**
     * Pinned/Unpinned
     */
    public function pinned(Seller $seller)
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
    public function edit(Seller $seller)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Seller $seller)
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

            $impact = [
                'count' => count($ids),
                'deals' => Deal::whereIn('seller_id', $ids)->count(),
                'active_deals' => Deal::whereIn('seller_id', $ids)
                    ->where('progress_percent', '<', 100)
                    ->count(),
                'files' => FileFolder::whereIn('seller_id', $ids)->count(),
                'activities' => ActivityLog::where('loggable_type', Seller::class)
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
                $sellers = Seller::whereIn('id', $idsToDelete)->get();
                $overviewIds = $sellers->pluck('company_overview_id')->filter()->toArray();
                $financialIds = $sellers->pluck('financial_detail_id')->filter()->toArray();
                $partnershipIds = $sellers->pluck('partnership_detail_id')->filter()->toArray();
                $teaserIds = $sellers->pluck('teaser_center_id')->filter()->toArray();

                // 1. Delete polymorphic logs
                ActivityLog::where('loggable_type', Seller::class)
                    ->whereIn('loggable_id', $idsToDelete)
                    ->delete();

                // 2. Delete file associations
                FileFolder::whereIn('seller_id', $idsToDelete)->delete();

                // 3. Delete the sellers
                $deletedCount = Seller::whereIn('id', $idsToDelete)->delete();

                // 4. Clean up the detailed records (orphaned after seller is deleted)
                if (!empty($overviewIds)) {
                    SellersCompanyOverview::whereIn('id', $overviewIds)->delete();
                }
                if (!empty($financialIds)) {
                    SellersFinancialDetail::whereIn('id', $financialIds)->delete();
                }
                if (!empty($partnershipIds)) {
                    SellersPartnershipDetail::whereIn('id', $partnershipIds)->delete();
                }
                if (!empty($teaserIds)) {
                    SellersTeaserCenter::whereIn('id', $teaserIds)->delete();
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

        $sellers = Seller::with([
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
                            $q2->orWhereRaw('JSON_CONTAINS(JSON_EXTRACT(industry_ops, "$[*].id"), CAST(? AS JSON))', [$id]);
                        }
                    });
                });
            })
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhereRaw('JSON_CONTAINS(JSON_EXTRACT(niche_industry, "$[*].id"), CAST(? AS JSON))', [$id]);
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

        $sellers = Seller::with([
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
                            $q2->orWhereRaw('JSON_CONTAINS(JSON_EXTRACT(industry_ops, "$[*].id"), CAST(? AS JSON))', [$id]);
                        }
                    });
                });
            })
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhereRaw('JSON_CONTAINS(JSON_EXTRACT(niche_industry, "$[*].id"), CAST(? AS JSON))', [$id]);
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

        $sellers = Seller::with([
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
                            $q2->orWhereRaw('JSON_CONTAINS(JSON_EXTRACT(industry_ops, "$[*].id"), CAST(? AS JSON))', [$id]);
                        }
                    });
                });
            })
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhereRaw('JSON_CONTAINS(JSON_EXTRACT(niche_industry, "$[*].id"), CAST(? AS JSON))', [$id]);
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

        $sellers = Seller::with([
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
                            $q2->orWhereRaw('JSON_CONTAINS(JSON_EXTRACT(industry_ops, "$[*].id"), CAST(? AS JSON))', [$id]);
                        }
                    });
                });
            })
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhereRaw('JSON_CONTAINS(JSON_EXTRACT(niche_industry, "$[*].id"), CAST(? AS JSON))', [$id]);
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

        $sellers = Seller::with([
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
                            $q2->orWhereRaw('JSON_CONTAINS(JSON_EXTRACT(industry_ops, "$[*].id"), CAST(? AS JSON))', [$id]);
                        }
                    });
                });
            })
            ->when(!empty($priorityIndustries), function ($query) use ($priorityIndustries) {
                $query->whereHas('companyOverview', function ($q) use ($priorityIndustries) {
                    $q->where(function ($q2) use ($priorityIndustries) {
                        foreach ($priorityIndustries as $id) {
                            $q2->orWhereRaw('JSON_CONTAINS(JSON_EXTRACT(niche_industry, "$[*].id"), CAST(? AS JSON))', [$id]);
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
}
