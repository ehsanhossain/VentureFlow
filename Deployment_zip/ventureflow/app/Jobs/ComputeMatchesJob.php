<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Jobs;

use App\Models\Investor;
use App\Models\Target;
use App\Models\User;
use App\Notifications\MatchIQNotification;
use App\Services\MatchEngineService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * Background job to compute matches for a newly registered/imported prospect.
 * Dispatched onto the 'matching' queue to avoid blocking the main app.
 */
class ComputeMatchesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(
        private string $prospectType, // 'buyer' or 'seller'
        private int $prospectId
    ) {
        $this->onQueue('matching');
    }

    public function handle(MatchEngineService $engine): void
    {
        Log::info("MatchIQ: Computing matches for {$this->prospectType}#{$this->prospectId}");

        try {
            if ($this->prospectType === 'buyer') {
                $buyer = Investor::find($this->prospectId);
                if (!$buyer) {
                    Log::warning("MatchIQ: Buyer#{$this->prospectId} not found, skipping.");
                    return;
                }
                $matches = $engine->computeMatchesForBuyer($buyer);
            } else {
                $seller = Target::find($this->prospectId);
                if (!$seller) {
                    Log::warning("MatchIQ: Seller#{$this->prospectId} not found, skipping.");
                    return;
                }
                $matches = $engine->computeMatchesForSeller($seller);
            }

            // Dispatch notifications for strong matches (>= 70%)
            $strongMatches = $matches->where('total_score', '>=', 70);

            if ($strongMatches->isNotEmpty()) {
                $this->notifyAllUsers($strongMatches);
            }

            Log::info("MatchIQ: Computed {$matches->count()} matches ({$strongMatches->count()} strong) for {$this->prospectType}#{$this->prospectId}");
        } catch (\Throwable $e) {
            Log::error("MatchIQ Job failed: {$e->getMessage()}", [
                'type' => $this->prospectType,
                'id'   => $this->prospectId,
            ]);
            throw $e; // Let the queue retry
        }
    }

    /**
     * Send notifications for strong matches to all users.
     */
    private function notifyAllUsers($strongMatches): void
    {
        $users = User::all();

        foreach ($strongMatches as $match) {
            $match->load(['buyer.companyOverview', 'seller.companyOverview']);

            $buyerName  = $match->buyer?->companyOverview?->reg_name ?? "Investor #{$match->buyer_id}";
            $sellerName = $match->seller?->companyOverview?->reg_name ?? "Target #{$match->seller_id}";

            Notification::send($users, new MatchIQNotification(
                buyerName: $buyerName,
                sellerName: $sellerName,
                score: $match->total_score,
                tierLabel: $match->tier_label,
                matchId: $match->id,
                buyerId: $match->buyer_id,
                sellerId: $match->seller_id,
            ));
        }
    }
}
