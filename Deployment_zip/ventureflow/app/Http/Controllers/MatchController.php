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
     * List all matches, paginated, with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = MatchModel::with([
            'buyer.companyOverview',
            'seller.companyOverview',
        ])
        ->notDismissed()
        ->orderByDesc('total_score');

        // Filter: minimum score
        if ($request->filled('min_score')) {
            $query->minScore((int) $request->min_score);
        } else {
            $query->minScore(30); // Default: show any match above MIN_SCORE threshold
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

        $matches = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $matches->items(),
            'meta' => [
                'current_page' => $matches->currentPage(),
                'last_page'    => $matches->lastPage(),
                'total'        => $matches->total(),
                'per_page'     => $matches->perPage(),
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
    public function rescan(MatchEngineService $engine): JsonResponse
    {
        $count = $engine->fullRescan();

        return response()->json([
            'message' => "Rescan complete. {$count} matches computed.",
            'count'   => $count,
        ]);
    }

    /**
     * POST /api/matchiq/custom-score
     * Score targets in real-time using investor criteria overrides.
     * Results are NOT stored in the database — live preview only.
     *
     * Body: {
     *   investor_id: number,
     *   criteria: {
     *     industry_ids?: number[],
     *     target_countries?: number[],
     *     ebitda_min?: number,
     *     budget_min?: number,
     *     budget_max?: number,
     *     ownership_condition?: string
     *   }
     * }
     */
    public function customScore(Request $request, MatchEngineService $engine): JsonResponse
    {
        $investorId = $request->input('investor_id');
        $criteria   = $request->input('criteria', []);

        if (!$investorId) {
            return response()->json(['message' => 'investor_id is required.'], 422);
        }

        $investor = \App\Models\Investor::with(['companyOverview', 'financialDetails'])->find($investorId);

        if (!$investor) {
            return response()->json(['message' => 'Investor not found.'], 404);
        }

        $results = $engine->scoreWithCriteria($investor, $criteria);

        // Load target relationships for the response
        $formatted = array_map(function ($result) {
            $target = $result['target'];
            $target->load(['companyOverview', 'financialDetails']);

            return [
                'target_id'       => $result['target_id'],
                'total_score'     => $result['total_score'],
                'industry_score'  => $result['industry_score'],
                'geography_score' => $result['geography_score'],
                'financial_score' => $result['financial_score'],
                'ownership_score' => $result['ownership_score'],
                'explanations'    => $result['explanations'],
                'seller'          => $target,
            ];
        }, $results);

        return response()->json([
            'data'  => $formatted,
            'total' => count($formatted),
            'note'  => 'Custom-scored results — not stored in database.',
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
