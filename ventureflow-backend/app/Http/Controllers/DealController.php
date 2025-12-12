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

        $deals = $query->orderBy('updated_at', 'desc')->get();

        // Group by stage
        $grouped = [];
        foreach (Deal::STAGES as $code => $stage) {
            $grouped[$code] = [
                'code' => $code,
                'name' => $stage['name'],
                'progress' => $stage['progress'],
                'deals' => $deals->where('stage_code', $code)->values(),
            ];
        }

        return response()->json([
            'stages' => Deal::STAGES,
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

        // Set default stage and progress
        $stageCode = $validated['stage_code'] ?? 'K';
        $validated['stage_code'] = $stageCode;
        $validated['progress_percent'] = Deal::STAGES[$stageCode]['progress'] ?? 5;

        $deal = Deal::create($validated);

        // Log initial stage
        DealStageHistory::create([
            'deal_id' => $deal->id,
            'from_stage' => null,
            'to_stage' => $stageCode,
            'changed_by_user_id' => Auth::id(),
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
            'stage_code' => 'required|string|max:1|in:K,J,I,H,G,F,E,D,C,B,A',
        ]);

        $fromStage = $deal->stage_code;
        $toStage = $validated['stage_code'];

        if ($fromStage !== $toStage) {
            // Update deal
            $deal->update([
                'stage_code' => $toStage,
                'progress_percent' => Deal::STAGES[$toStage]['progress'] ?? 0,
            ]);

            // Log stage change
            DealStageHistory::create([
                'deal_id' => $deal->id,
                'from_stage' => $fromStage,
                'to_stage' => $toStage,
                'changed_by_user_id' => Auth::id(),
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
        $deal->delete();

        return response()->json([
            'message' => 'Deal deleted successfully',
        ]);
    }
}
