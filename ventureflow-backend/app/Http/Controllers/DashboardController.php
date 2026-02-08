<?php

namespace App\Http\Controllers;

use App\Models\Buyer;
use App\Models\Seller;
use App\Models\Deal;
use App\Models\Partner;
use App\Models\ActivityLog;
use App\Models\PipelineStage;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Arr;
use DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard KPI statistics
     */
    public function stats(Request $request)
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        
        // Active deals count (exclude lost/closed)
        $activeDeals = Deal::where(function($q) {
            $q->whereNotIn('status', ['lost', 'closed', 'Lost', 'Closed'])
              ->orWhereNull('status');
        })->count();
        
        // Pipeline value (sum of estimated_ev_value for active deals)
        $pipelineValue = Deal::where(function($q) {
            $q->whereNotIn('status', ['lost', 'closed', 'Lost', 'Closed'])
              ->orWhereNull('status');
        })->sum('estimated_ev_value');
        
        // Deals created this month
        $dealsThisMonth = Deal::where('created_at', '>=', $startOfMonth)->count();
        
        // Total investors
        $totalInvestors = Buyer::count();
        
        // Investors this month
        $investorsThisMonth = Buyer::where('created_at', '>=', $startOfMonth)->count();
        
        // Total targets
        $totalTargets = Seller::count();
        
        // Targets this month
        $targetsThisMonth = Seller::where('created_at', '>=', $startOfMonth)->count();
        
        // Total partners
        $totalPartners = Partner::count();
        
        // Partners this month
        $partnersThisMonth = Partner::where('created_at', '>=', $startOfMonth)->count();
        
        // Won deals this month
        $wonDealsThisMonth = Deal::where('created_at', '>=', $startOfMonth)
            ->whereIn('status', ['won', 'Won', 'closed', 'Closed'])
            ->count();
        
        return response()->json([
            'active_deals' => $activeDeals,
            'pipeline_value' => round($pipelineValue, 2),
            'deals_this_month' => $dealsThisMonth,
            'won_deals_this_month' => $wonDealsThisMonth,
            'total_investors' => $totalInvestors,
            'investors_this_month' => $investorsThisMonth,
            'total_targets' => $totalTargets,
            'targets_this_month' => $targetsThisMonth,
            'total_partners' => $totalPartners,
            'partners_this_month' => $partnersThisMonth,
            'month_name' => $now->format('F Y'),
        ]);
    }
    
    /**
     * Get deal distribution by pipeline stage for chart visualization
     */
    public function pipeline(Request $request)
    {
        $type = $request->get('type', 'buyer'); // buyer or seller
        
        // Get all stages for this pipeline type
        $stages = PipelineStage::where('pipeline_type', $type)
            ->orderBy('order_index')
            ->get(['code', 'name', 'order_index']);
        
        // Count deals per stage (active deals only)
        $dealCounts = Deal::select('stage_code', DB::raw('COUNT(*) as count'), DB::raw('SUM(estimated_ev_value) as total_value'))
            ->when($type === 'buyer', function ($q) {
                $q->whereNotNull('buyer_id');
            })
            ->when($type === 'seller', function ($q) {
                $q->whereNotNull('seller_id');
            })
            ->where(function($q) {
                $q->whereNotIn('status', ['lost', 'closed', 'Lost', 'Closed'])
                  ->orWhereNull('status');
            })
            ->groupBy('stage_code')
            ->get()
            ->keyBy('stage_code');
        
        // Build result with all stages (even if 0 deals)
        $result = $stages->map(function ($stage) use ($dealCounts) {
            $data = $dealCounts->get($stage->code);
            return [
                'code' => $stage->code,
                'name' => $stage->name,
                'order' => $stage->order_index,
                'count' => $data ? (int)$data->count : 0,
                'value' => $data ? round($data->total_value ?? 0, 2) : 0,
            ];
        });
        
        return response()->json($result);
    }
    
    /**
     * Get monthly deal stage distribution report
     */
    public function monthlyReport(Request $request)
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();
        
        // Get deals created this month with their current stage
        $thisMonthDeals = Deal::whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->select('stage_code', DB::raw('COUNT(*) as count'))
            ->groupBy('stage_code')
            ->get();
        
        // Get all stages
        $buyerStages = PipelineStage::where('pipeline_type', 'buyer')
            ->orderBy('order_index')
            ->get(['code', 'name']);
        
        $sellerStages = PipelineStage::where('pipeline_type', 'seller')
            ->orderBy('order_index')
            ->get(['code', 'name']);
        
        // Map deal counts to stages
        $dealMap = $thisMonthDeals->keyBy('stage_code');
        
        $buyerData = $buyerStages->map(function ($stage) use ($dealMap) {
            return [
                'name' => $stage->name,
                'count' => (int)($dealMap->get($stage->code)?->count ?? 0),
            ];
        });
        
        $sellerData = $sellerStages->map(function ($stage) use ($dealMap) {
            return [
                'name' => $stage->name,
                'count' => (int)($dealMap->get($stage->code)?->count ?? 0),
            ];
        });
        
        return response()->json([
            'month' => $now->format('F Y'),
            'buyer_pipeline' => $buyerData,
            'seller_pipeline' => $sellerData,
            'total_new_deals' => $thisMonthDeals->sum('count'),
        ]);
    }
    
    /**
     * Get recent activity logs
     */
    public function activity(Request $request)
    {
        $limit = $request->get('limit', 10);
        
        $logs = ActivityLog::with(['user', 'loggable'])
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
                    'created_at' => $log->created_at,
                    'time_ago' => $log->created_at->diffForHumans(),
                ];
            });
        
        return response()->json($logs);
    }
    
    /**
     * Get recent registrations (investors and targets)
     */
    public function recent(Request $request)
    {
        $limit = $request->get('limit', 5);
        
        // Recent investors
        $investors = Buyer::with(['companyOverview.hqCountry'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($buyer) {
                return [
                    'id' => $buyer->id,
                    'type' => 'investor',
                    'name' => $buyer->companyOverview?->reg_name ?? 'Unknown',
                    'code' => $buyer->buyer_id,
                    'country' => $buyer->companyOverview?->hqCountry?->name ?? 'N/A',
                    'country_flag' => $buyer->companyOverview?->hqCountry?->svg_icon_url ?? null,
                    'status' => $buyer->companyOverview?->status ?? 'Active',
                    'created_at' => $buyer->created_at,
                    'link' => "/prospects/investor/{$buyer->id}",
                ];
            });
        
        // Recent targets
        $targets = Seller::with(['companyOverview.hqCountry'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($seller) {
                return [
                    'id' => $seller->id,
                    'type' => 'target',
                    'name' => $seller->companyOverview?->reg_name ?? 'Unknown',
                    'code' => $seller->seller_id,
                    'country' => $seller->companyOverview?->hqCountry?->name ?? 'N/A',
                    'country_flag' => $seller->companyOverview?->hqCountry?->svg_icon_url ?? null,
                    'status' => $seller->companyOverview?->status ?? 'Active',
                    'created_at' => $seller->created_at,
                    'link' => "/prospects/target/{$seller->id}",
                ];
            });
        
        return response()->json([
            'investors' => $investors,
            'targets' => $targets,
        ]);
    }

    // ==========================================
    // LEGACY METHODS (kept for backward compatibility)
    // ==========================================

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

        $sellers = Seller::with('companyOverview')
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($seller) use ($showSellerName) {
                return [
                    'id' => $seller->id,
                    'image' => $seller->image ?? null,
                    'reg_name' => $showSellerName ? ($seller->companyOverview->reg_name ?? null) : ($seller->seller_id ?? 'Restricted'),
                    'status' => $seller->companyOverview->status ?? null,
                    'type' => 1,
                    'created_at' => $seller->created_at,
                ];
            });

        $buyers = Buyer::with('companyOverview')
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($buyer) use ($showBuyerName) {
                return [
                    'id' => $buyer->id,
                    'image' => $buyer->image ?? null,
                    'reg_name' => $showBuyerName ? ($buyer->companyOverview->reg_name ?? null) : ($buyer->buyer_id ?? 'Restricted'),
                    'status' => $buyer->companyOverview->status ?? null,
                    'type' => 2, // Buyer
                    'created_at' => $buyer->created_at,
                ];
            });

        $combined = collect([])
            ->merge($sellers)
            ->merge($buyers)
            ->sortByDesc('created_at')
            ->take(20)
            ->values()
            ->map(function ($item) {
                return Arr::except($item, ['created_at']);
            });

        return response()->json($combined);
    }

    public function getCounts()
    {
        $now = Carbon::now();

        $total = [
            'sellers' => Seller::where('status', 1)->count(),
            'buyers' => Buyer::where('status', 1)->count(),
            'partners' => Partner::where('status', 1)->count(),
        ];

        $monthly = [
            'sellers' => Seller::where('status', 1)
                ->whereYear('created_at', $now->year)
                ->whereMonth('created_at', $now->month)
                ->count(),

            'buyers' => Buyer::where('status', 1)
                ->whereYear('created_at', $now->year)
                ->whereMonth('created_at', $now->month)
                ->count(),

            'partners' => Partner::where('status', 1)
                ->whereYear('created_at', $now->year)
                ->whereMonth('created_at', $now->month)
                ->count(),
        ];

        return response()->json([
            'total' => $total,
            'current_month' => $monthly,
        ]);
    }
}
