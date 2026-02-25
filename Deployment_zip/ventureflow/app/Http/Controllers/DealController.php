<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use App\Models\Deal;
use App\Models\Currency;
use App\Models\DealFee;
use App\Models\DealStageHistory;
use App\Models\FeeTier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use App\Notifications\DealStatusNotification;
use App\Models\ActivityLog;

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

        // Filter deals by the pipeline they belong to
        $query->where('pipeline_type', $view);

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
        
        // Expected Transaction (sum of ticket_size or EV for active deals)
        $expectedTransaction = (clone $activeDeals)->selectRaw('COALESCE(SUM(COALESCE(ticket_size, estimated_ev_value, 0)), 0) as total')->value('total');
        
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
            'buyer_id' => 'nullable|exists:buyers,id',
            'seller_id' => 'nullable|exists:sellers,id',
            'name' => 'required|string|max:255',
            'industry' => 'nullable|string|max:255',
            'region' => 'nullable|string|max:255',
            'estimated_ev_value' => 'nullable|numeric|min:0',
            'estimated_ev_currency' => 'nullable|string|max:3',
            'ticket_size' => 'nullable|numeric|min:0',
            'stage_code' => 'nullable|string|max:1',
            'priority' => 'nullable|in:low,medium,high',
            'possibility' => 'nullable|string|max:50',
            'pic_user_id' => 'nullable|exists:users,id',
            'internal_pic' => 'nullable|array',
            'target_close_date' => 'nullable|date',
            'pipeline_type' => 'nullable|in:buyer,seller',
            'deal_type' => 'nullable|string|max:50',
        ]);

        // At least one party (buyer or seller) must be selected
        if (empty($validated['buyer_id']) && empty($validated['seller_id'])) {
            return response()->json([
                'message' => 'At least one party (buyer or seller) must be selected.',
                'errors' => ['parties' => ['At least one party (buyer or seller) must be selected.']],
            ], 422);
        }

        // Determine stage code and look up progress from pipeline stages
        $stageCode = $validated['stage_code'] ?? null;
        $pipelineType = $validated['pipeline_type'] ?? 'buyer';
        
        $stageQuery = \App\Models\PipelineStage::where('is_active', true);

        if ($stageCode) {
             $stageQuery->where('code', $stageCode)->where('pipeline_type', $pipelineType);
        } else {
             // Default to the first stage of the specific pipeline if no stage provided
             $stageQuery->where('pipeline_type', $pipelineType)->orderBy('order_index', 'asc');
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
            Notification::send($recipients, new DealStatusNotification($deal, 'created', [], Auth::user()));
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
                'stageHistory.changedBy.employee',
                'activityLogs.user.employee',
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
            'buyer_id' => 'nullable|exists:buyers,id',
            'seller_id' => 'nullable|exists:sellers,id',
            'industry' => 'nullable|string|max:255',
            'region' => 'nullable|string|max:255',
            'estimated_ev_value' => 'nullable|numeric|min:0',
            'estimated_ev_currency' => 'nullable|string|max:3',
            'ticket_size' => 'nullable|numeric|min:0',
            'priority' => 'nullable|in:low,medium,high',
            'possibility' => 'nullable|string|max:50',
            'pic_user_id' => 'nullable|exists:users,id',
            'internal_pic' => 'nullable|array',
            'target_close_date' => 'nullable|date',
            'status' => 'nullable|in:active,on_hold,lost,won',
            'lost_reason' => 'nullable|string',
            'deal_type' => 'nullable|string|max:50',
        ]);

        $deal->update($validated);

        return response()->json([
            'message' => 'Deal updated successfully',
            'deal' => $deal->fresh(['buyer.companyOverview', 'seller.companyOverview', 'pic']),
        ]);
    }

    /**
     * Pre-check stage transition: validate gate rules and return monetization info.
     * Frontend calls this BEFORE attempting a move to show confirmation UI.
     */
    public function stageCheck(Request $request, Deal $deal): JsonResponse
    {
        $validated = $request->validate([
            'to_stage' => 'required|string|max:2',
            'pipeline_type' => 'nullable|in:buyer,seller',
        ]);

        $toStage = $validated['to_stage'];
        // Use the deal's own pipeline_type, not a request parameter
        $pipelineType = $deal->pipeline_type ?? ($validated['pipeline_type'] ?? 'buyer');

        // Look up destination stage from the deal's pipeline
        $stage = \App\Models\PipelineStage::where('pipeline_type', $pipelineType)
            ->where('code', $toStage)
            ->where('is_active', true)
            ->first();

        if (!$stage) {
            return response()->json(['message' => 'Invalid target stage.'], 422);
        }

        // Evaluate gate rules for ALL intermediate stages (not just target)
        $allStages = \App\Models\PipelineStage::where('pipeline_type', $pipelineType)
            ->where('is_active', true)
            ->orderBy('order_index')
            ->get();

        $fromIdx = $allStages->search(fn($s) => $s->code === $deal->stage_code);
        $toIdx = $allStages->search(fn($s) => $s->code === $toStage);

        $gateErrors = [];

        if ($fromIdx !== false && $toIdx !== false && $fromIdx !== $toIdx) {
            if ($toIdx > $fromIdx) {
                // Forward move: check all stages from (current+1) to target (inclusive)
                $stagesToCheck = $allStages->slice($fromIdx + 1, $toIdx - $fromIdx);
            } else {
                // Backward move: check only the target stage
                $stagesToCheck = collect([$allStages[$toIdx]]);
            }

            foreach ($stagesToCheck as $checkStage) {
                $rules = $checkStage->gate_rules ?? [];
                $errors = $this->evaluateGateRules($deal, $rules);
                foreach ($errors as $err) {
                    $err['stage_name'] = $checkStage->name;
                    $err['message'] = "[{$checkStage->name}] " . $err['message'];
                    $gateErrors[] = $err;
                }
            }
        }

        if (!empty($gateErrors)) {
            return response()->json([
                'gate_passed' => false,
                'gate_errors' => array_map(fn($e) => $e['message'], $gateErrors),
                'gate_error_details' => array_values($gateErrors),
                'monetization' => null,
            ]);
        }

        // Check monetization config
        $monetization = $stage->monetization_config ?? [];
        $monetizationInfo = null;

        if (!empty($monetization['enabled'])) {
            $rawTicketSize = (float) ($deal->ticket_size ?? 0);

            // Convert ticket_size from deal currency to USD
            $dealCurrency = strtoupper(trim($deal->estimated_ev_currency ?? 'USD'));
            $ticketSizeUsd = $rawTicketSize;

            if ($dealCurrency && $dealCurrency !== 'USD' && $rawTicketSize > 0) {
                $currencyRecord = Currency::where('currency_code', $dealCurrency)->first();
                if ($currencyRecord && (float) $currencyRecord->exchange_rate > 0) {
                    // exchange_rate = how many units of this currency per 1 USD
                    // So USD amount = raw amount / exchange_rate
                    $ticketSizeUsd = round($rawTicketSize / (float) $currencyRecord->exchange_rate, 2);
                }
            }
            // Determine fee side from the deal's pipeline
            $feeSide = $pipelineType === 'seller' ? 'target' : 'investor';

            // Determine if this is the LAST active stage (final settlement)
            $isLastStage = ($toIdx !== false && $toIdx === $allStages->count() - 1);

            if ($isLastStage) {
                // ── FINAL SETTLEMENT MODE ──
                // Look up fee tier for the deal's transaction size
                $feeTier = FeeTier::where('fee_type', $feeSide)
                    ->where('min_amount', '<=', $ticketSizeUsd)
                    ->where(function ($q) use ($ticketSizeUsd) {
                        $q->whereNull('max_amount')
                          ->orWhere('max_amount', '>=', $ticketSizeUsd);
                    })
                    ->where('is_active', true)
                    ->orderBy('order_index')
                    ->first();

                $successFee = 0;
                if ($feeTier) {
                    if ($feeTier->success_fee_fixed !== null && $feeTier->success_fee_fixed > 0) {
                        $successFee = (float) $feeTier->success_fee_fixed;
                    } elseif ($feeTier->success_fee_rate !== null && $feeTier->success_fee_rate > 0) {
                        $successFee = $ticketSizeUsd * ((float) $feeTier->success_fee_rate / 100);
                    }
                }

                // Query accumulated monthly payments for this deal (deductible ones)
                $accumulatedFees = DealFee::where('deal_id', $deal->id)
                    ->where('deducted_from_success', true)
                    ->orderBy('created_at')
                    ->get();

                $totalMonthlyReceived = $accumulatedFees->sum('final_amount');
                $monthsCount = $accumulatedFees->count();

                // Build payment history for the modal
                $paymentHistory = $accumulatedFees->map(function ($fee) {
                    return [
                        'id' => $fee->id,
                        'stage_code' => $fee->stage_code,
                        'fee_type' => $fee->fee_type,
                        'amount' => $fee->final_amount,
                        'date' => $fee->created_at->format('Y-m-d'),
                        'month_label' => $fee->created_at->format('M Y'),
                    ];
                })->values()->toArray();

                $netPayout = round($successFee - $totalMonthlyReceived, 2);

                $monetizationInfo = [
                    'enabled' => true,
                    'mode' => 'final_settlement',
                    'payment_name' => $monetization['payment_name'] ?? 'Final Settlement',
                    'ticket_size_usd' => $ticketSizeUsd,
                    'source_currency' => $dealCurrency,
                    'original_ticket_size' => $rawTicketSize,
                    'fee_side' => $feeSide,
                    'fee_tier' => $feeTier ? [
                        'id' => $feeTier->id,
                        'min_amount' => $feeTier->min_amount,
                        'max_amount' => $feeTier->max_amount,
                        'success_fee_fixed' => $feeTier->success_fee_fixed,
                        'success_fee_rate' => $feeTier->success_fee_rate,
                    ] : null,
                    'success_fee' => round($successFee, 2),
                    'accumulated_payments' => [
                        'total_received' => round($totalMonthlyReceived, 2),
                        'months_count' => $monthsCount,
                        'history' => $paymentHistory,
                    ],
                    'net_payout' => $netPayout,
                    'deduct_from_success_fee' => $monetization['deduct_from_success_fee'] ?? true,
                ];
            } else {
                // ── STAGE FEE MODE (intermediate stage) ──
                // Use the configured amount from pipeline settings, NOT fee tier calculation
                $configuredAmount = (float) ($monetization['amount'] ?? 0);

                $monetizationInfo = [
                    'enabled' => true,
                    'mode' => 'stage_fee',
                    'payment_name' => $monetization['payment_name'] ?? '',
                    'amount' => $configuredAmount,
                    'type' => $monetization['type'] ?? 'one_time',
                    'deduct_from_success_fee' => $monetization['deduct_from_success_fee'] ?? false,
                    'ticket_size_usd' => $ticketSizeUsd,
                    'source_currency' => $dealCurrency,
                    'original_ticket_size' => $rawTicketSize,
                    'fee_side' => $feeSide,
                ];
            }
        }

        return response()->json([
            'gate_passed' => true,
            'gate_errors' => [],
            'monetization' => $monetizationInfo,
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
            // Optional fee confirmation from monetization modal
            'fee_confirmation' => 'nullable|array',
            'fee_confirmation.fee_tier_id' => 'nullable|integer',
            'fee_confirmation.fee_side' => 'nullable|in:investor,target',
            'fee_confirmation.fee_type' => 'nullable|in:success,retainer,monthly,one_time',
            'fee_confirmation.calculated_amount' => 'nullable|numeric|min:0',
            'fee_confirmation.final_amount' => 'nullable|numeric|min:0',
            'fee_confirmation.deducted_from_success' => 'nullable|boolean',
        ]);

        $fromStage = $deal->stage_code;
        $toStage = $validated['stage_code'];
        // Use the deal's own pipeline_type for stage resolution
        $pipelineType = $deal->pipeline_type ?? ($validated['pipeline_type'] ?? 'buyer');

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

            // Enforce gate rules for ALL intermediate stages (not just target)
            if ($stage) {
                $allStages = \App\Models\PipelineStage::where('pipeline_type', $pipelineType)
                    ->where('is_active', true)
                    ->orderBy('order_index')
                    ->get();

                $fromIdx = $allStages->search(fn($s) => $s->code === $fromStage);
                $toIdx = $allStages->search(fn($s) => $s->code === $toStage);

                $gateErrors = [];

                if ($fromIdx !== false && $toIdx !== false && $fromIdx !== $toIdx) {
                    if ($toIdx > $fromIdx) {
                        $stagesToCheck = $allStages->slice($fromIdx + 1, $toIdx - $fromIdx);
                    } else {
                        $stagesToCheck = collect([$allStages[$toIdx]]);
                    }

                    foreach ($stagesToCheck as $checkStage) {
                        $rules = $checkStage->gate_rules ?? [];
                        $errors = $this->evaluateGateRules($deal, $rules);
                        foreach ($errors as $err) {
                            $err['stage_name'] = $checkStage->name;
                            $err['message'] = "[{$checkStage->name}] " . $err['message'];
                            $gateErrors[] = $err;
                        }
                    }
                }

                if (!empty($gateErrors)) {
                    return response()->json([
                        'message' => 'Cannot move to this stage — conditions not met.',
                        'gate_errors' => array_map(fn($e) => $e['message'], $gateErrors),
                        'gate_error_details' => array_values($gateErrors),
                    ], 422);
                }
            }

            // Update deal
            $deal->update([
                'stage_code' => $toStage,
                'progress_percent' => $stage ? $stage->progress : 0,
            ]);

            // Record fee if confirmation was provided
            if (!empty($validated['fee_confirmation'])) {
                $fc = $validated['fee_confirmation'];
                DealFee::create([
                    'deal_id' => $deal->id,
                    'fee_tier_id' => $fc['fee_tier_id'] ?? null,
                    'stage_code' => $toStage,
                    'fee_side' => $fc['fee_side'] ?? 'investor',
                    'fee_type' => $fc['fee_type'] ?? 'one_time',
                    'calculated_amount' => $fc['calculated_amount'] ?? 0,
                    'final_amount' => $fc['final_amount'] ?? $fc['calculated_amount'] ?? 0,
                    'deducted_from_success' => $fc['deducted_from_success'] ?? false,
                ]);
            }

            // Log stage change
            DealStageHistory::create([
                'deal_id' => $deal->id,
                'from_stage' => $fromStage,
                'to_stage' => $toStage,
                'changed_by_user_id' => Auth::id(),
            ]);

            // Resolve human-readable stage names
            $fromStageName = \App\Models\PipelineStage::where('pipeline_type', $pipelineType)
                ->where('code', $fromStage)
                ->where('is_active', true)
                ->value('name') ?? $fromStage;
            $toStageName = $stage ? $stage->name : $toStage;

            // Add Activity Log (using stage names, not codes)
            ActivityLog::create([
                'user_id' => Auth::id(),
                'loggable_id' => $deal->id,
                'loggable_type' => Deal::class,
                'type' => 'system',
                'content' => "Deal phase updated from {$fromStageName} to {$toStageName}",
            ]);

            // Notify Admins and PIC
            try {
                $investorName = $deal->buyer?->companyOverview?->reg_name ?? 'Unknown Investor';
                $sellerName = $deal->seller?->companyOverview?->reg_name ?? 'Unknown Seller';

                $recipients = User::role('System Admin')->get();
                if ($deal->pic_user_id) {
                    $recipients = $recipients->push(User::find($deal->pic_user_id));
                }
                $recipients = $recipients->unique('id');
                Notification::send($recipients, new DealStatusNotification($deal, 'stage_changed', [
                    'from_stage_name' => $fromStageName,
                    'to_stage_name'   => $toStageName,
                    'investor_name'   => $investorName,
                    'seller_name'     => $sellerName,
                ], Auth::user()));
            } catch (\Exception $e) { /* Ignore */ }
        }

        return response()->json([
            'message' => 'Stage updated successfully',
            'deal' => $deal->fresh(['buyer.companyOverview', 'seller.companyOverview', 'pic', 'fees']),
        ]);
    }

    /**
     * Evaluate gate rules against a deal.
     * Returns an array of structured error objects: { message, action_type, missing_fields }
     */
    private function evaluateGateRules(Deal $deal, array $rules): array
    {
        $errors = [];

        foreach ($rules as $rule) {
            $field = $rule['field'] ?? null;
            $operator = $rule['operator'] ?? 'equals';
            $value = $rule['value'] ?? null;

            if (!$field) continue;

            switch ($field) {
                case 'both_parties':
                    if ($value && (!$deal->buyer_id || !$deal->seller_id)) {
                        $missing = [];
                        if (!$deal->buyer_id) $missing[] = 'buyer';
                        if (!$deal->seller_id) $missing[] = 'seller';
                        $errors[] = [
                            'message' => 'Both a buyer and seller must be assigned before moving to this stage.',
                            'action_type' => count($missing) === 2 ? 'assign_both' : ($missing[0] === 'buyer' ? 'assign_buyer' : 'assign_seller'),
                            'missing_fields' => $missing,
                        ];
                    }
                    break;

                case 'has_buyer':
                    if ($value && !$deal->buyer_id) {
                        $errors[] = [
                            'message' => 'A buyer (investor) must be assigned before moving to this stage.',
                            'action_type' => 'assign_buyer',
                            'missing_fields' => ['buyer'],
                        ];
                    }
                    break;

                case 'has_seller':
                    if ($value && !$deal->seller_id) {
                        $errors[] = [
                            'message' => 'A seller (target) must be assigned before moving to this stage.',
                            'action_type' => 'assign_seller',
                            'missing_fields' => ['seller'],
                        ];
                    }
                    break;

                case 'ticket_size':
                    $actual = (float) ($deal->ticket_size ?? 0);
                    if ($operator === 'greater_than' && $actual <= (float) $value) {
                        $errors[] = [
                            'message' => 'Ticket size must be greater than $' . number_format((float) $value) . '.',
                            'action_type' => 'edit_deal',
                            'missing_fields' => ['ticket_size'],
                        ];
                    } elseif ($operator === 'less_than' && $actual >= (float) $value) {
                        $errors[] = [
                            'message' => 'Ticket size must be less than $' . number_format((float) $value) . '.',
                            'action_type' => 'edit_deal',
                            'missing_fields' => ['ticket_size'],
                        ];
                    } elseif ($operator === 'equals' && $actual != (float) $value) {
                        $errors[] = [
                            'message' => 'Ticket size must equal $' . number_format((float) $value) . '.',
                            'action_type' => 'edit_deal',
                            'missing_fields' => ['ticket_size'],
                        ];
                    }
                    break;

                case 'priority':
                    $actual = $deal->priority ?? '';
                    if ($operator === 'equals' && $actual !== $value) {
                        $errors[] = [
                            'message' => "Deal priority must be '{$value}' to enter this stage.",
                            'action_type' => 'edit_deal',
                            'missing_fields' => ['priority'],
                        ];
                    } elseif ($operator === 'not_equals' && $actual === $value) {
                        $errors[] = [
                            'message' => "Deal priority must not be '{$value}' to enter this stage.",
                            'action_type' => 'edit_deal',
                            'missing_fields' => ['priority'],
                        ];
                    }
                    break;

                case 'probability':
                    $actual = $deal->possibility ?? '';
                    if ($operator === 'equals' && $actual !== $value) {
                        $errors[] = [
                            'message' => "Deal probability must be '{$value}' to enter this stage.",
                            'action_type' => 'edit_deal',
                            'missing_fields' => ['probability'],
                        ];
                    } elseif ($operator === 'not_equals' && $actual === $value) {
                        $errors[] = [
                            'message' => "Deal probability must not be '{$value}' to enter this stage.",
                            'action_type' => 'edit_deal',
                            'missing_fields' => ['probability'],
                        ];
                    }
                    break;

                case 'has_documents':
                    $count = $deal->documents()->count();
                    if ($operator === 'greater_than' && $count <= (int) $value) {
                        $errors[] = [
                            'message' => 'Deal must have more than ' . (int) $value . ' document(s) attached.',
                            'action_type' => 'edit_deal',
                            'missing_fields' => ['documents'],
                        ];
                    }
                    break;

                case 'industry':
                    if ($operator === 'not_empty' && empty($deal->industry)) {
                        $errors[] = [
                            'message' => 'Deal industry must be set before moving to this stage.',
                            'action_type' => 'edit_deal',
                            'missing_fields' => ['industry'],
                        ];
                    }
                    break;
            }
        }

        return $errors;
    }

    /**
     * Analyze deletion impact for a deal.
     */
    public function deleteAnalyze(Deal $deal): JsonResponse
    {
        $activityLogs = \App\Models\ActivityLog::where('loggable_type', Deal::class)
            ->where('loggable_id', $deal->id)
            ->count();

        $stageHistory = DealStageHistory::where('deal_id', $deal->id)->count();

        $fees = DealFee::where('deal_id', $deal->id)->count();

        return response()->json([
            'name' => $deal->name,
            'impact' => [
                'activity_logs' => $activityLogs,
                'stage_history' => $stageHistory,
                'fees'          => $fees,
            ],
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
