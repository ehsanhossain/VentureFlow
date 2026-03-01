<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use App\Models\DealMatch as MatchModel;
use App\Models\Deal;
use App\Services\MatchEngineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    /**
     * GET /api/matchiq
     * List all matches, clustered by investor, with filters.
     *
     * Returns: { data: [{ investor: {…}, targets: [{match, seller}] }], meta: {…} }
     */
    public function index(Request $request): JsonResponse
    {
        $query = MatchModel::with([
            'buyer.companyOverview',
            'seller.companyOverview',
            'seller.financialDetails',
            'buyer.financialDetails',
        ])
        ->notDismissed()
        ->orderByDesc('total_score');

        // Filter: minimum score
        if ($request->filled('min_score')) {
            $query->minScore((int) $request->min_score);
        } else {
            $query->minScore(30);
        }

        // Filter: tier (front-end dropdown: excellent, strong, good, fair, all)
        if ($request->filled('tier') && $request->tier !== 'all') {
            $tierMap = [
                'excellent' => [90, 100],
                'strong'    => [80, 89],
                'good'      => [70, 79],
                'fair'      => [60, 69],
            ];
            if (isset($tierMap[$request->tier])) {
                $query->whereBetween('total_score', $tierMap[$request->tier]);
            }
        }

        // Filter: industry_ids (array of industry IDs from dropdowns)
        if ($request->filled('industry_ids')) {
            $industryIds = (array) $request->industry_ids;
            $query->where(function ($q) use ($industryIds) {
                $q->whereHas('buyer.companyOverview', function ($bq) use ($industryIds) {
                    $bq->where(function ($inner) use ($industryIds) {
                        foreach ($industryIds as $id) {
                            $inner->orWhere('company_industry', 'LIKE', "%\"id\":{$id}%")
                                  ->orWhere('company_industry', 'LIKE', "%\"id\": {$id}%");
                        }
                    });
                })
                ->orWhereHas('seller.companyOverview', function ($sq) use ($industryIds) {
                    $sq->where(function ($inner) use ($industryIds) {
                        foreach ($industryIds as $id) {
                            $inner->orWhere('industry_ops', 'LIKE', "%\"id\":{$id}%")
                                  ->orWhere('industry_ops', 'LIKE', "%\"id\": {$id}%")
                                  ->orWhere('niche_industry', 'LIKE', "%\"id\":{$id}%")
                                  ->orWhere('niche_industry', 'LIKE', "%\"id\": {$id}%");
                        }
                    });
                });
            });
        }
        // Backward compat: string-based industry filter
        elseif ($request->filled('industry')) {
            $industry = $request->industry;
            $query->where(function ($q) use ($industry) {
                $q->whereHas('buyer.companyOverview', function ($bq) use ($industry) {
                    $bq->where('company_industry', 'LIKE', "%{$industry}%");
                })
                ->orWhereHas('seller.companyOverview', function ($sq) use ($industry) {
                    $sq->where('industry_ops', 'LIKE', "%{$industry}%")
                       ->orWhere('niche_industry', 'LIKE', "%{$industry}%");
                });
            });
        }

        // Filter: country_ids (array of country IDs from dropdowns)
        if ($request->filled('country_ids')) {
            $countryIds = array_map('strval', (array) $request->country_ids);
            $query->where(function ($q) use ($countryIds) {
                $q->whereHas('buyer.companyOverview', function ($bq) use ($countryIds) {
                    $bq->where(function ($inner) use ($countryIds) {
                        foreach ($countryIds as $cid) {
                            $inner->orWhere('target_countries', 'LIKE', "%\"id\":{$cid}%")
                                  ->orWhere('target_countries', 'LIKE', "%\"id\": {$cid}%")
                                  ->orWhere('target_countries', 'LIKE', "%\"country_id\":{$cid}%")
                                  ->orWhere('target_countries', 'LIKE', "%\"country_id\": {$cid}%");
                        }
                    });
                })
                ->orWhereHas('seller.companyOverview', function ($sq) use ($countryIds) {
                    $sq->where(function ($inner) use ($countryIds) {
                        foreach ($countryIds as $cid) {
                            $inner->orWhereIn('hq_country', $countryIds)
                                  ->orWhere('op_countries', 'LIKE', "%\"id\":{$cid}%")
                                  ->orWhere('op_countries', 'LIKE', "%\"id\": {$cid}%");
                        }
                    });
                });
            });
        }
        // Backward compat: string-based country filter
        elseif ($request->filled('country')) {
            $country = $request->country;
            $query->where(function ($q) use ($country) {
                $q->whereHas('buyer.companyOverview', function ($bq) use ($country) {
                    $bq->where('target_countries', 'LIKE', "%{$country}%");
                })
                ->orWhereHas('seller.companyOverview', function ($sq) use ($country) {
                    $sq->where('hq_country', $country)
                       ->orWhere('op_countries', 'LIKE', "%{$country}%");
                });
            });
        }

        // Filter: direction (investor-only or target-only)
        if ($request->filled('buyer_id')) {
            $query->where('buyer_id', $request->buyer_id);
        }
        if ($request->filled('seller_id')) {
            $query->where('seller_id', $request->seller_id);
        }

        // Get all matches (no hard pagination — cluster later)
        $allMatches = $query->get();

        // ─── Cluster by Investor or Target based on mode ────────
        $mode = $request->get('mode', 'investor'); // 'investor' or 'target'

        if ($mode === 'target') {
            // Target-centric: group by seller, list matched investors
            $clustered = $allMatches->groupBy('seller_id')->map(function ($matches, $sellerId) {
                $firstMatch = $matches->first();
                $target = $firstMatch->seller;
                $overview = $target?->companyOverview;

                return [
                    'target' => [
                        'id'         => $target?->id,
                        'seller_id'  => $target?->seller_id,
                        'reg_name'   => $overview?->reg_name ?? 'Unknown Target',
                        'hq_country' => $overview?->hq_country,
                        'industry'   => $overview?->industry_ops,
                        'image'      => $target?->image,
                    ],
                    'investors' => $matches->map(function ($match) {
                        $investor = $match->buyer;
                        $overview = $investor?->companyOverview;

                        return [
                            'match_id'          => $match->id,
                            'investor_id'       => $investor?->id,
                            'buyer_id'          => $investor?->buyer_id,
                            'reg_name'          => $overview?->reg_name ?? 'Unknown Investor',
                            'hq_country'        => $overview?->hq_country,
                            'industry'          => $overview?->company_industry,
                            'image'             => $overview?->buyer_image ?? $overview?->profile_picture,
                            'total_score'       => $match->total_score,
                            'industry_score'    => $match->industry_score,
                            'geography_score'   => $match->geography_score,
                            'financial_score'   => $match->financial_score,
                            'transaction_score' => $match->transaction_score,
                            'tier'              => $match->tier,
                            'tier_label'        => $match->tier_label,
                            'status'            => $match->status,
                        ];
                    })->sortByDesc('total_score')->values(),
                    'best_score'      => $matches->max('total_score'),
                    'investor_count'  => $matches->count(),
                ];
            })->sortByDesc('best_score')->values();
        } else {
            // Investor-centric (default): group by buyer, list matched targets
        $clustered = $allMatches->groupBy('buyer_id')->map(function ($matches, $buyerId) {
            $firstMatch = $matches->first();
            $investor = $firstMatch->buyer;
            $overview = $investor?->companyOverview;

            return [
                'investor' => [
                    'id'         => $investor?->id,
                    'buyer_id'   => $investor?->buyer_id,
                    'reg_name'   => $overview?->reg_name ?? 'Unknown Investor',
                    'hq_country' => $overview?->hq_country,
                    'industry'   => $overview?->company_industry,
                    'image'      => $overview?->buyer_image ?? $overview?->profile_picture,
                ],
                'targets' => $matches->map(function ($match) {
                    $seller   = $match->seller;
                    $overview = $seller?->companyOverview;

                    return [
                        'match_id'          => $match->id,
                        'target_id'         => $seller?->id,
                        'seller_id'         => $seller?->seller_id,
                        'reg_name'          => $overview?->reg_name ?? 'Unknown Target',
                        'hq_country'        => $overview?->hq_country,
                        'industry'          => $overview?->industry_ops,
                        'image'             => $seller?->image,
                        'total_score'       => $match->total_score,
                        'industry_score'    => $match->industry_score,
                        'geography_score'   => $match->geography_score,
                        'financial_score'   => $match->financial_score,
                        'transaction_score' => $match->transaction_score,
                        'tier'              => $match->tier,
                        'tier_label'        => $match->tier_label,
                        'status'            => $match->status,
                    ];
                })->sortByDesc('total_score')->values(),
                'best_score'    => $matches->max('total_score'),
                'target_count'  => $matches->count(),
            ];
        })->sortByDesc('best_score')->values();
        } // end mode if/else

        // Paginate the clustered results
        $page    = max(1, (int) $request->get('page', 1));
        $perPage = max(1, (int) $request->get('per_page', 20));
        $total   = $clustered->count();
        $paged   = $clustered->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'data' => $paged,
            'meta' => [
                'current_page' => $page,
                'last_page'    => (int) ceil($total / $perPage),
                'total'        => $total,
                'per_page'     => $perPage,
                'total_matches' => $allMatches->count(),
            ],
            'weights' => MatchEngineService::DEFAULT_WEIGHTS,
        ]);
    }

    /**
     * GET /api/matchiq/match/{id}
     * Get detailed match data for comparison panel.
     */
    public function show(int $id): JsonResponse
    {
        $match = MatchModel::with([
            'buyer.companyOverview',
            'buyer.financialDetails',
            'seller.companyOverview',
            'seller.financialDetails',
        ])->findOrFail($id);

        $investor = $match->buyer;
        $target   = $match->seller;
        $invCO    = $investor?->companyOverview;
        $invFin   = $investor?->financialDetails;
        $tgtCO    = $target?->companyOverview;
        $tgtFin   = $target?->financialDetails;

        // Resolve country IDs → {id, name, flag, is_region}
        $resolveCountry = function ($id) {
            if (empty($id)) return null;
            $c = \App\Models\Country::find((int) $id);
            return $c ? ['id' => $c->id, 'name' => $c->name, 'flag' => $c->svg_icon_url, 'is_region' => $c->is_region] : null;
        };

        // Resolve target_countries (JSON array of IDs or objects)
        $resolveTargetCountries = function ($raw) use ($resolveCountry) {
            if (empty($raw)) return [];
            $arr = is_string($raw) ? json_decode($raw, true) : (is_array($raw) ? $raw : []);
            if (!is_array($arr)) return [];
            $result = [];
            foreach ($arr as $item) {
                $cid = is_array($item) ? ($item['id'] ?? null) : $item;
                if ($cid) {
                    $resolved = $resolveCountry($cid);
                    if ($resolved) $result[] = $resolved;
                }
            }
            return $result;
        };

        // ─── Compute USD-converted budget values ──────────────────
        $convertBudgetToUsd = function ($rawBudget, $currency) {
            if (empty($rawBudget)) return null;
            $arr = is_string($rawBudget) ? json_decode($rawBudget, true) : (is_array($rawBudget) ? $rawBudget : null);
            if (!is_array($arr)) return null;
            $min = (float) ($arr['min'] ?? $arr[0] ?? 0);
            $max = (float) ($arr['max'] ?? $arr[1] ?? 0);
            $cur = $currency ?: 'USD';
            return [
                'min' => \App\Models\ExchangeRate::toUsd($min, $cur),
                'max' => \App\Models\ExchangeRate::toUsd($max, $cur),
            ];
        };

        $investorCurrency = $invFin?->default_currency ?? $invFin?->register_currency ?? 'USD';
        $targetCurrency   = $tgtFin?->default_currency ?? 'USD';

        return response()->json([
            'match' => [
                'id'                => $match->id,
                'total_score'       => $match->total_score,
                'industry_score'    => $match->industry_score,
                'geography_score'   => $match->geography_score,
                'financial_score'   => $match->financial_score,
                'transaction_score' => $match->transaction_score,
                'tier'              => $match->tier,
                'tier_label'        => $match->tier_label,
                'status'            => $match->status,
            ],
            'investor' => [
                'id'                   => $investor?->id,
                'buyer_id'             => $investor?->buyer_id,
                'reg_name'             => $invCO?->reg_name,
                'hq_country'           => $resolveCountry($invCO?->hq_country),
                'industry'             => $invCO?->company_industry,
                'target_industries'    => $invCO?->main_industry_operations,
                'target_countries'     => $resolveTargetCountries($invCO?->target_countries),
                'investment_budget'    => $invCO?->investment_budget,
                'investment_budget_usd' => $convertBudgetToUsd($invCO?->investment_budget, $investorCurrency),
                'investment_condition' => $invCO?->investment_condition,
                'reason_ma'            => $invCO?->reason_ma,
                'image'                => $invCO?->buyer_image ?? $invCO?->profile_picture,
                'currency'             => $investorCurrency,
            ],
            'target' => [
                'id'                          => $target?->id,
                'seller_id'                   => $target?->seller_id,
                'reg_name'                    => $tgtCO?->reg_name,
                'hq_country'                  => $resolveCountry($tgtCO?->hq_country),
                'industry'                    => $tgtCO?->industry_ops,
                'reason_ma'                   => $tgtCO?->reason_ma,
                'expected_investment_amount'   => $tgtFin?->expected_investment_amount,
                'expected_investment_amount_usd' => $convertBudgetToUsd($tgtFin?->expected_investment_amount, $targetCurrency),
                'investment_condition'         => $tgtFin?->investment_condition,
                'image'                        => $target?->image,
                'currency'                     => $targetCurrency,
            ],
        ]);
    }

    /**
     * GET /api/matchiq/investor/{id}
     * Get matches for a specific investor.
     */
    public function forInvestor(int $id): JsonResponse
    {
        $matches = MatchModel::with(['seller.companyOverview'])
            ->where('buyer_id', $id)
            ->notDismissed()
            ->minScore(50)
            ->orderByDesc('total_score')
            ->limit(20)
            ->get();

        return response()->json($matches);
    }

    /**
     * GET /api/matchiq/target/{id}
     * Get matches for a specific target.
     */
    public function forTarget(int $id): JsonResponse
    {
        $matches = MatchModel::with(['buyer.companyOverview'])
            ->where('seller_id', $id)
            ->notDismissed()
            ->minScore(50)
            ->orderByDesc('total_score')
            ->limit(20)
            ->get();

        return response()->json($matches);
    }

    /**
     * POST /api/matchiq/rescan
     * Full rescan — recomputes all matches.
     */
    public function rescan(Request $request, MatchEngineService $engine): JsonResponse
    {
        // Accept optional custom weights from the engine controller
        $weights = $request->input('weights', []);

        $count = $engine->fullRescan($weights);

        return response()->json([
            'message' => "Rescan complete. {$count} matches computed.",
            'count'   => $count,
        ]);
    }

    /**
     * POST /api/matchiq/{id}/dismiss
     * Dismiss a match (won't show up again).
     */
    public function dismiss(int $id): JsonResponse
    {
        $match = MatchModel::findOrFail($id);
        $match->update([
            'status'      => 'dismissed',
            'reviewed_by' => auth()->id(),
        ]);

        return response()->json(['message' => 'Match dismissed.']);
    }

    /**
     * POST /api/matchiq/{id}/approve
     * Approve/like a match.
     */
    public function approve(int $id): JsonResponse
    {
        $match = MatchModel::findOrFail($id);
        $match->update([
            'status'      => 'approved',
            'reviewed_by' => auth()->id(),
        ]);

        return response()->json(['message' => 'Match approved.']);
    }

    /**
     * POST /api/matchiq/{id}/create-deal
     * Convert a match into a new deal.
     */
    public function createDeal(Request $request, int $id): JsonResponse
    {
        $match = MatchModel::with(['buyer.companyOverview', 'seller.companyOverview'])->findOrFail($id);

        // Create a new deal from the match
        $deal = Deal::create([
            'name'         => ($match->buyer?->companyOverview?->reg_name ?? 'Investor')
                            . ' × '
                            . ($match->seller?->companyOverview?->reg_name ?? 'Target'),
            'buyer_id'     => $match->buyer_id,
            'seller_id'    => $match->seller_id,
            'status'       => 'active',
            'stage_code'   => 'F', // Starting stage
            'pipeline_type' => 'seller',
        ]);

        $match->update([
            'status'      => 'converted',
            'deal_id'     => $deal->id,
            'reviewed_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Deal created from match.',
            'deal_id' => $deal->id,
        ]);
    }

    /**
     * GET /api/matchiq/stats
     * Summary statistics for the dashboard.
     */
    public function stats(): JsonResponse
    {
        $total     = MatchModel::active()->minScore(30)->count();
        $excellent = MatchModel::active()->where('total_score', '>=', 90)->count();
        $strong    = MatchModel::active()->whereBetween('total_score', [80, 89])->count();
        $good      = MatchModel::active()->whereBetween('total_score', [70, 79])->count();
        $fair      = MatchModel::active()->whereBetween('total_score', [30, 69])->count();

        $avgScore = MatchModel::active()->minScore(30)->avg('total_score');

        return response()->json([
            'total'     => $total,
            'excellent' => $excellent,
            'strong'    => $strong,
            'good'      => $good,
            'fair'      => $fair,
            'avg_score' => round($avgScore ?? 0, 1),
        ]);
    }
}
