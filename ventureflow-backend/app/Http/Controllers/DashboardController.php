<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use App\Models\Investor;
use App\Models\Target;
use App\Models\Deal;
use App\Models\Partner;
use App\Models\ActivityLog;
use App\Models\PipelineStage;
use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Arr;
use DB;

class DashboardController extends Controller
{
    /**
     * Main dashboard endpoint — single API call returns everything
     */
    public function index(Request $request)
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();

        // === KPI STATS ===
        $activeDeals = Deal::where(function($q) {
            $q->whereNotIn('status', ['lost', 'closed', 'Lost', 'Closed'])
              ->orWhereNull('status');
        })->count();

        $pipelineValue = Deal::where(function($q) {
            $q->whereNotIn('status', ['lost', 'closed', 'Lost', 'Closed'])
              ->orWhereNull('status');
        })->selectRaw('COALESCE(SUM(COALESCE(ticket_size, estimated_ev_value, 0)), 0) as total')->value('total');

        $dealsThisMonth = Deal::where('created_at', '>=', $startOfMonth)->count();
        $totalInvestors = Investor::where('status', 1)->count();
        $totalTargets = Target::where('status', 1)->count();
        $investorsThisMonth = Investor::where('created_at', '>=', $startOfMonth)->count();
        $targetsThisMonth = Target::where('created_at', '>=', $startOfMonth)->count();

        // Unmatched investors (no deal linked)
        $unmatchedInvestors = Investor::where('status', 1)
            ->whereDoesntHave('deals')
            ->count();

        // Unmatched targets (no deal linked)
        $unmatchedTargets = Target::where('status', 1)
            ->whereDoesntHave('deals')
            ->count();

        // === DEALS REQUIRING ACTION ===
        $dealsNeedingAction = $this->getDealsNeedingAction();

        // === PIPELINE FUNNEL ===
        $buyerPipeline = $this->getPipelineData('buyer');
        $sellerPipeline = $this->getPipelineData('seller');

        // === DEAL FLOW TREND (last 6 months) ===
        $dealFlowTrend = $this->getDealFlowTrend();

        // === GEOGRAPHIC DISTRIBUTION ===
        $geoDistribution = $this->getGeographicDistribution();

        // === RECENT ACTIVITY ===
        $activities = $this->getRecentActivity(8);

        // === RECENT REGISTRATIONS ===
        $recentInvestors = $this->getRecentRegistrations('investor', 4);
        $recentTargets = $this->getRecentRegistrations('target', 4);

        return response()->json([
            'stats' => [
                'active_deals' => $activeDeals,
                'pipeline_value' => round($pipelineValue, 2),
                'deals_this_month' => $dealsThisMonth,
                'total_investors' => $totalInvestors,
                'total_targets' => $totalTargets,
                'investors_this_month' => $investorsThisMonth,
                'targets_this_month' => $targetsThisMonth,
                'unmatched_investors' => $unmatchedInvestors,
                'unmatched_targets' => $unmatchedTargets,
                'month_name' => $now->format('F Y'),
            ],
            'deals_needing_action' => $dealsNeedingAction,
            'buyer_pipeline' => $buyerPipeline,
            'seller_pipeline' => $sellerPipeline,
            'deal_flow_trend' => $dealFlowTrend,
            'geo_distribution' => $geoDistribution,
            'activities' => $activities,
            'recent_investors' => $recentInvestors,
            'recent_targets' => $recentTargets,
        ]);
    }

    /**
     * Deals that need attention — stuck, overdue target_close_date, recently stalled
     */
    private function getDealsNeedingAction()
    {
        $now = Carbon::now();

        // Active deals with details
        $deals = Deal::with([
                'buyer.companyOverview',
                'seller.companyOverview',
                'pic',
            ])
            ->where(function($q) {
                $q->whereNotIn('status', ['lost', 'closed', 'Lost', 'Closed', 'won', 'Won'])
                  ->orWhereNull('status');
            })
            ->orderByRaw("CASE WHEN target_close_date IS NOT NULL AND target_close_date < ? THEN 0 ELSE 1 END", [$now])
            ->orderBy('updated_at', 'asc') // Least recently updated first (most stale)
            ->limit(6)
            ->get()
            ->map(function ($deal) use ($now) {
                $isOverdue = $deal->target_close_date && Carbon::parse($deal->target_close_date)->lt($now);
                $daysSinceUpdate = $deal->updated_at ? Carbon::parse($deal->updated_at)->diffInDays($now) : 0;
                $isStale = $daysSinceUpdate > 14;

                $urgency = 'normal';
                if ($isOverdue) $urgency = 'overdue';
                elseif ($isStale) $urgency = 'stale';

                $buyerName = $deal->buyer?->companyOverview?->reg_name;
                $sellerName = $deal->seller?->companyOverview?->reg_name;

                return [
                    'id' => $deal->id,
                    'name' => $deal->name,
                    'buyer_name' => $buyerName,
                    'seller_name' => $sellerName,
                    'stage_name' => $deal->stage_name,
                    'stage_code' => $deal->stage_code,
                    'progress' => $deal->progress_percent,
                    'priority' => $deal->priority,
                    'urgency' => $urgency,
                    'days_since_update' => (int)$daysSinceUpdate,
                    'target_close_date' => $deal->target_close_date?->format('Y-m-d'),
                    'pic_name' => $deal->pic?->name ?? 'Unassigned',
                    'estimated_value' => $deal->ticket_size ?? $deal->estimated_ev_value,
                    'currency' => $deal->estimated_ev_currency ?? 'USD',
                ];
            });

        return $deals;
    }

    /**
     * Pipeline data with counts and values per stage
     */
    private function getPipelineData($type)
    {
        $stages = PipelineStage::where('pipeline_type', $type)
            ->orderBy('order_index')
            ->get(['code', 'name', 'order_index', 'progress']);

        $dealCounts = Deal::select('stage_code', DB::raw('COUNT(*) as count'), DB::raw('SUM(COALESCE(ticket_size, estimated_ev_value, 0)) as total_value'))
            ->when($type === 'buyer', fn($q) => $q->whereNotNull('buyer_id'))
            ->when($type === 'seller', fn($q) => $q->whereNotNull('seller_id'))
            ->where(function($q) {
                $q->whereNotIn('status', ['lost', 'closed', 'Lost', 'Closed'])
                  ->orWhereNull('status');
            })
            ->groupBy('stage_code')
            ->get()
            ->keyBy('stage_code');

        return $stages->map(function ($stage) use ($dealCounts) {
            $data = $dealCounts->get($stage->code);
            return [
                'code' => $stage->code,
                'name' => $stage->name,
                'order' => $stage->order_index,
                'progress' => $stage->progress,
                'count' => $data ? (int)$data->count : 0,
                'value' => $data ? round($data->total_value ?? 0, 2) : 0,
            ];
        });
    }

    /**
     * Deal flow trend — last 6 months showing new deals created, closed, lost
     */
    private function getDealFlowTrend()
    {
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $start = $date->copy()->startOfMonth();
            $end = $date->copy()->endOfMonth();

            $created = Deal::whereBetween('created_at', [$start, $end])->count();
            $won = Deal::whereBetween('updated_at', [$start, $end])
                ->whereIn('status', ['won', 'Won'])->count();
            $lost = Deal::whereBetween('updated_at', [$start, $end])
                ->whereIn('status', ['lost', 'Lost'])->count();

            $months[] = [
                'month' => $date->format('M'),
                'full_month' => $date->format('F Y'),
                'created' => $created,
                'won' => $won,
                'lost' => $lost,
            ];
        }

        return $months;
    }

    /**
     * Geographic distribution — count of investors and targets by country
     */
    private function getGeographicDistribution()
    {
        // Investors by country
        $investorsByCountry = DB::table('buyers')
            ->join('buyers_company_overviews', 'buyers.company_overview_id', '=', 'buyers_company_overviews.id')
            ->join('countries', 'buyers_company_overviews.hq_country', '=', 'countries.id')
            ->where('buyers.status', 1)
            ->select(
                'countries.id as country_id',
                'countries.name as country_name',
                'countries.alpha_2_code',
                'countries.svg_icon as flag',
                DB::raw('COUNT(*) as investor_count')
            )
            ->groupBy('countries.id', 'countries.name', 'countries.alpha_2_code', 'countries.svg_icon')
            ->get();

        // Targets by country
        $targetsByCountry = DB::table('sellers')
            ->join('sellers_company_overviews', 'sellers.company_overview_id', '=', 'sellers_company_overviews.id')
            ->join('countries', 'sellers_company_overviews.hq_country', '=', 'countries.id')
            ->where('sellers.status', 1)
            ->select(
                'countries.id as country_id',
                'countries.name as country_name',
                'countries.alpha_2_code',
                'countries.svg_icon as flag',
                DB::raw('COUNT(*) as target_count')
            )
            ->groupBy('countries.id', 'countries.name', 'countries.alpha_2_code', 'countries.svg_icon')
            ->get();

        // Merge data
        $merged = [];
        foreach ($investorsByCountry as $row) {
            $merged[$row->country_id] = [
                'country_id' => $row->country_id,
                'country_name' => $row->country_name,
                'alpha_2_code' => $row->alpha_2_code,
                'flag' => $row->flag,
                'investors' => $row->investor_count,
                'targets' => 0,
                'total' => $row->investor_count,
            ];
        }
        foreach ($targetsByCountry as $row) {
            if (isset($merged[$row->country_id])) {
                $merged[$row->country_id]['targets'] = $row->target_count;
                $merged[$row->country_id]['total'] += $row->target_count;
            } else {
                $merged[$row->country_id] = [
                    'country_id' => $row->country_id,
                    'country_name' => $row->country_name,
                    'alpha_2_code' => $row->alpha_2_code,
                    'flag' => $row->flag,
                    'investors' => 0,
                    'targets' => $row->target_count,
                    'total' => $row->target_count,
                ];
            }
        }

        // Sort by total descending
        usort($merged, fn($a, $b) => $b['total'] - $a['total']);

        return array_values($merged);
    }

    /**
     * Recent activity logs
     */
    private function getRecentActivity($limit = 10)
    {
        return ActivityLog::with(['user', 'loggable'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($log) {
                $entityName = 'Unknown';
                $entityType = 'system';
                $entityId = null;
                $link = null;

                if ($log->loggable) {
                    $entityId = $log->loggable->id;

                    if ($log->loggable_type === 'App\\Models\\Buyer') {
                        $entityType = 'investor';
                        $entityName = $log->loggable->companyOverview?->reg_name ?? 'Investor';
                        $link = "/prospects/investor/{$entityId}";
                    } elseif ($log->loggable_type === 'App\\Models\\Seller') {
                        $entityType = 'target';
                        $entityName = $log->loggable->companyOverview?->reg_name ?? 'Target';
                        $link = "/prospects/target/{$entityId}";
                    } elseif ($log->loggable_type === 'App\\Models\\Deal') {
                        $entityType = 'deal';
                        $entityName = $log->loggable->name ?? 'Deal';
                        $link = "/deal-pipeline";
                    }
                }

                return [
                    'id' => $log->id,
                    'type' => $log->type,
                    'entity_type' => $entityType,
                    'entity_name' => $entityName,
                    'entity_id' => $entityId,
                    'content' => $log->content,
                    'user_name' => $log->user?->name ?? 'System',
                    'link' => $link,
                    'time_ago' => $log->created_at->diffForHumans(),
                ];
            });
    }

    /**
     * Recent registrations (investors or targets)
     */
    private function getRecentRegistrations($type, $limit = 5)
    {
        if ($type === 'investor') {
            return Investor::with(['companyOverview.hqCountry'])
                ->where('status', 1)
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(fn($buyer) => [
                    'id' => $buyer->id,
                    'name' => $buyer->companyOverview?->reg_name ?? 'Unknown',
                    'code' => $buyer->buyer_id,
                    'country' => $buyer->companyOverview?->hqCountry?->name ?? 'N/A',
                    'flag' => $buyer->companyOverview?->hqCountry?->svg_icon_url ?? null,
                    'link' => "/prospects/investor/{$buyer->id}",
                ]);
        }

        return Target::with(['companyOverview.hqCountry'])
            ->where('status', 1)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn($seller) => [
                'id' => $seller->id,
                'name' => $seller->companyOverview?->reg_name ?? 'Unknown',
                'code' => $seller->seller_id,
                'country' => $seller->companyOverview?->hqCountry?->name ?? 'N/A',
                'flag' => $seller->companyOverview?->hqCountry?->svg_icon_url ?? null,
                'link' => "/prospects/target/{$seller->id}",
            ]);
    }


    // ==========================================
    // LEGACY ENDPOINTS (kept for backward compat)
    // ==========================================

    public function stats(Request $request) {
        return $this->index($request);
    }

    public function pipeline(Request $request)
    {
        $type = $request->get('type', 'buyer');
        return response()->json($this->getPipelineData($type));
    }

    public function monthlyReport(Request $request)
    {
        return response()->json(['deal_flow_trend' => $this->getDealFlowTrend()]);
    }

    public function activity(Request $request)
    {
        $limit = $request->get('limit', 10);
        return response()->json($this->getRecentActivity($limit));
    }

    public function recent(Request $request)
    {
        $limit = $request->get('limit', 5);
        return response()->json([
            'investors' => $this->getRecentRegistrations('investor', $limit),
            'targets' => $this->getRecentRegistrations('target', $limit),
        ]);
    }

    public function getSellerBuyerData(Request $request)
    {
        $user = $request->user();
        $isPartner = $user && ($user->hasRole('partner') || $user->is_partner ?? false);

        $showSellerName = true;
        $showBuyerName = true;

        if ($isPartner) {
            $sSet = \App\Models\PartnerSetting::where('setting_key', 'seller_sharing_config')->first();
            $bSet = \App\Models\PartnerSetting::where('setting_key', 'buyer_sharing_config')->first();
            $showSellerName = $sSet && is_array($sSet->setting_value) && ($sSet->setting_value['company_overview.reg_name'] ?? false);
            $showBuyerName = $bSet && is_array($bSet->setting_value) && ($bSet->setting_value['company_overview.reg_name'] ?? false);
        }

        $sellers = Target::with('companyOverview')->latest()->take(20)->get()
            ->map(fn($seller) => [
                'id' => $seller->id,
                'image' => $seller->image ?? null,
                'reg_name' => $showSellerName ? ($seller->companyOverview->reg_name ?? null) : ($seller->seller_id ?? 'Restricted'),
                'status' => $seller->companyOverview->status ?? null,
                'type' => 1,
                'created_at' => $seller->created_at,
            ]);

        $buyers = Investor::with('companyOverview')->latest()->take(20)->get()
            ->map(fn($buyer) => [
                'id' => $buyer->id,
                'image' => $buyer->image ?? null,
                'reg_name' => $showBuyerName ? ($buyer->companyOverview->reg_name ?? null) : ($buyer->buyer_id ?? 'Restricted'),
                'status' => $buyer->companyOverview->status ?? null,
                'type' => 2,
                'created_at' => $buyer->created_at,
            ]);

        $combined = collect([])
            ->merge($sellers)
            ->merge($buyers)
            ->sortByDesc('created_at')
            ->take(20)
            ->values()
            ->map(fn($item) => Arr::except($item, ['created_at']));

        return response()->json($combined);
    }

    public function getCounts()
    {
        $now = Carbon::now();

        $total = [
            'sellers' => Target::where('status', 1)->count(),
            'buyers' => Investor::where('status', 1)->count(),
            'partners' => Partner::where('status', 1)->count(),
        ];

        $monthly = [
            'sellers' => Target::where('status', 1)->whereYear('created_at', $now->year)->whereMonth('created_at', $now->month)->count(),
            'buyers' => Investor::where('status', 1)->whereYear('created_at', $now->year)->whereMonth('created_at', $now->month)->count(),
            'partners' => Partner::where('status', 1)->whereYear('created_at', $now->year)->whereMonth('created_at', $now->month)->count(),
        ];

        return response()->json([
            'total' => $total,
            'current_month' => $monthly,
        ]);
    }
}
