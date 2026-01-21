<?php

namespace App\Http\Controllers;

use App\Models\Deal;
use App\Models\DealStageHistory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use App\Notifications\DealStatusNotification;

class DealController extends Controller
{
    /**
     * Get all deals grouped by stage
     */
    public function index(Request $request): JsonResponse
    {
        $query = Deal::with(['buyer.companyOverview', 'seller.companyOverview', 'pic']);
        $view = $request->query('view', 'buyer');
        
        // Ensure view is valid
        if (!in_array($view, ['buyer', 'seller'])) {
            $view = 'buyer';
        }

        // Apply filters
        if ($request->has('stage_code')) {
            $query->where('stage_code', $request->stage_code);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }
        if ($request->has('pic_user_id')) {
            $query->where('pic_user_id', $request->pic_user_id);
        }
        if ($request->has('industry')) {
            $query->where('industry', 'like', '%' . $request->industry . '%');
        }
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhereHas('buyer.companyOverview', function ($bq) use ($search) {
                        $bq->where('reg_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('seller.companyOverview', function ($sq) use ($search) {
                        $sq->where('reg_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->has('countries')) {
            $countryIds = (array) $request->countries;
            $query->where(function ($q) use ($countryIds) {
                $q->whereHas('buyer.companyOverview', function ($bco) use ($countryIds) {
                    $bco->whereIn('hq_country', $countryIds);
                })
                ->orWhereHas('seller.companyOverview', function ($sco) use ($countryIds) {
                    $sco->whereIn('hq_country', $countryIds);
                });
            });
        }

        // UNBREAKABLE: Ensure deals only appear if they have a valid ACTIVE entity for the current view
        if ($view === 'buyer') {
            $query->whereHas('buyer.companyOverview', function ($q) {
                $q->where('status', 'Active');
            });
        } else {
            $query->whereHas('seller', function ($q) {
                $q->where('status', '1');
            });
        }

        $deals = $query->withCount(['activityLogs as comment_count' => function($q) {
            $q->where('type', 'comment');
        }])->orderBy('updated_at', 'desc')->get();

        // Fetch dynamic stages
        $stages = \App\Models\PipelineStage::where('pipeline_type', $view)
            ->where('is_active', true)
            ->orderBy('order_index')
            ->get();

        // Group by stage
        $grouped = [];
        foreach ($stages as $stage) {
            $grouped[$stage->code] = [
                'code' => $stage->code,
                'name' => $stage->name,
                'progress' => $stage->progress,
                'deals' => $deals->where('stage_code', $stage->code)->values(),
            ];
        }

        return response()->json([
            'stages' => $stages,
            'grouped' => $grouped,
            'total' => $deals->count(),
        ]);
    }

    /**
     * Dashboard KPIs
     */
    public function dashboard(): JsonResponse
    {
        $activeDeals = Deal::where('status', 'active');
        
        // Expected Transaction (sum of EV for active deals)
        $expectedTransaction = (clone $activeDeals)->sum('estimated_ev_value');
        
        // Active Deals count
        $activeDealCount = (clone $activeDeals)->count();
        
        // Late Stage (E, D, C, B - LOI to Closing)
        $lateStageCount = (clone $activeDeals)->whereIn('stage_code', ['E', 'D', 'C', 'B'])->count();
        
        // Average Progress
        $avgProgress = (clone $activeDeals)->avg('progress_percent') ?? 0;
        
        // Velocity Score (avg stage transitions in last 30 days)
        $velocityScore = DealStageHistory::where('changed_at', '>=', now()->subDays(30))->count();
        if ($activeDealCount > 0) {
            $velocityScore = round($velocityScore / $activeDealCount, 1);
        }

        return response()->json([
            'expected_transaction' => $expectedTransaction,
            'active_deals' => $activeDealCount,
            'late_stage' => $lateStageCount,
            'avg_progress' => round($avgProgress, 1),
            'velocity_score' => $velocityScore,
        ]);
    }

    /**
     * Create a new deal
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'buyer_id' => 'required|exists:buyers,id',
            'seller_id' => 'required|exists:sellers,id',
            'name' => 'required|string|max:255',
            'industry' => 'nullable|string|max:255',
            'region' => 'nullable|string|max:255',
            'estimated_ev_value' => 'nullable|numeric|min:0',
            'estimated_ev_currency' => 'nullable|string|max:3',
            'stage_code' => 'nullable|string|max:1',
            'priority' => 'nullable|in:low,medium,high',
            'pic_user_id' => 'nullable|exists:users,id',
            'target_close_date' => 'nullable|date',
        ]);

        // Determine stage code and look up progress from pipeline stages
        $stageCode = $validated['stage_code'] ?? null;
        
        $stageQuery = \App\Models\PipelineStage::where('is_active', true);

        if ($stageCode) {
             $stageQuery->where('code', $stageCode);
        } else {
             // Default to the first stage of the buyer pipeline if no stage provided
             $stageQuery->where('pipeline_type', 'buyer')->orderBy('order_index', 'asc');
        }
        
        $stage = $stageQuery->first();

        // If still no stage found (e.g. invalid code provided), fallback to any first active stage
        if (!$stage) {
            $stage = \App\Models\PipelineStage::where('is_active', true)->orderBy('order_index', 'asc')->first();
        }

        $validated['stage_code'] = $stage ? $stage->code : 'A'; // Fallback to 'A' if absolutely nothing found
        $validated['progress_percent'] = $stage ? $stage->progress : 0;

        $deal = Deal::create($validated);

        // Log initial stage
        DealStageHistory::create([
            'deal_id' => $deal->id,
            'from_stage' => null,
            'to_stage' => $validated['stage_code'],
            'changed_by_user_id' => Auth::id(),
        ]);

        // Add Activity Log
        ActivityLog::create([
            'user_id' => Auth::id(),
            'loggable_id' => $deal->id,
            'loggable_type' => Deal::class,
            'type' => 'system',
            'content' => "Deal created and moved to phase " . $validated['stage_code'],
        ]);

        // Notify Admins and PIC
        try {
            $recipients = User::role('System Admin')->get();
            if ($deal->pic_user_id) {
                $recipients = $recipients->push(User::find($deal->pic_user_id));
            }
            $recipients = $recipients->unique('id');
            Notification::send($recipients, new DealStatusNotification($deal, 'created'));
        } catch (\Exception $e) { /* Ignore */ }

        return response()->json([
            'message' => 'Deal created successfully',
            'deal' => $deal->load(['buyer.companyOverview', 'seller.companyOverview', 'pic']),
        ], 201);
    }

    /**
     * Get deal details
     */
    public function show(Deal $deal): JsonResponse
    {
        return response()->json([
            'deal' => $deal->load([
                'buyer.companyOverview',
                'seller.companyOverview',
                'pic',
                'stageHistory.changedBy',
                'comments.author',
                'documents',
            ]),
        ]);
    }

    /**
     * Update deal
     */
    public function update(Request $request, Deal $deal): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'industry' => 'nullable|string|max:255',
            'region' => 'nullable|string|max:255',
            'estimated_ev_value' => 'nullable|numeric|min:0',
            'estimated_ev_currency' => 'nullable|string|max:3',
            'priority' => 'nullable|in:low,medium,high',
            'pic_user_id' => 'nullable|exists:users,id',
            'target_close_date' => 'nullable|date',
            'status' => 'nullable|in:active,on_hold,lost,won',
        ]);

        $deal->update($validated);

        return response()->json([
            'message' => 'Deal updated successfully',
            'deal' => $deal->fresh(['buyer.companyOverview', 'seller.companyOverview', 'pic']),
        ]);
    }

    /**
     * Update deal stage (for drag-and-drop)
     */
    public function updateStage(Request $request, Deal $deal): JsonResponse
    {
        $validated = $request->validate([
            'stage_code' => 'required|string|max:2',
            'pipeline_type' => 'nullable|in:buyer,seller',
        ]);

        $fromStage = $deal->stage_code;
        $toStage = $validated['stage_code'];
        $pipelineType = $validated['pipeline_type'] ?? 'buyer';

        if ($fromStage !== $toStage) {
            // Look up stage to get correct progress
            $stage = \App\Models\PipelineStage::where('pipeline_type', $pipelineType)
                ->where('code', $toStage)
                ->where('is_active', true)
                ->first();

            // Fallback: try the other pipeline type
            if (!$stage) {
                $stage = \App\Models\PipelineStage::where('code', $toStage)
                    ->where('is_active', true)
                    ->first();
            }

            // Update deal
            $deal->update([
                'stage_code' => $toStage,
                'progress_percent' => $stage ? $stage->progress : 0,
            ]);

            // Log stage change
            DealStageHistory::create([
                'deal_id' => $deal->id,
                'from_stage' => $fromStage,
                'to_stage' => $toStage,
                'changed_by_user_id' => Auth::id(),
            ]);

            // Add Activity Log
            ActivityLog::create([
                'user_id' => Auth::id(),
                'loggable_id' => $deal->id,
                'loggable_type' => Deal::class,
                'type' => 'system',
                'content' => "Deal phase updated from {$fromStage} to {$toStage}",
            ]);

            // Notify Admins and PIC
            try {
                $recipients = User::role('System Admin')->get();
                if ($deal->pic_user_id) {
                    $recipients = $recipients->push(User::find($deal->pic_user_id));
                }
                $recipients = $recipients->unique('id');
                Notification::send($recipients, new DealStatusNotification($deal, 'stage_changed'));
            } catch (\Exception $e) { /* Ignore */ }
        }

        return response()->json([
            'message' => 'Stage updated successfully',
            'deal' => $deal->fresh(['buyer.companyOverview', 'seller.companyOverview', 'pic']),
        ]);
    }

    /**
     * Delete deal
     */
    public function destroy(Deal $deal): JsonResponse
    {
        // UNBREAKABLE: Cleanup activity logs
        \App\Models\ActivityLog::where('loggable_type', Deal::class)
            ->where('loggable_id', $deal->id)
            ->delete();

        $deal->delete();

        return response()->json([
            'message' => 'Deal deleted successfully',
        ]);
    }
}
