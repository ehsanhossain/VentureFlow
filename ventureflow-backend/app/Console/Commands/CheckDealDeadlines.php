<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Deal;
use App\Models\DealStageDeadline;
use App\Models\PipelineStage;
use App\Models\User;
use App\Notifications\DealDeadlineNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Notification;

class CheckDealDeadlines extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'deals:check-deadlines';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for deals and stages approaching their deadlines (3 days, on due date, and overdue)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking deal deadlines...');

        $admins = User::role('System Admin')->get();

        // ── 1. Check overall deal target_close_date (7 and 15 days) ──
        $dealDeadlines = [15, 7];
        foreach ($dealDeadlines as $days) {
            $targetDate = Carbon::now()->addDays($days)->toDateString();
            $deals = Deal::whereDate('target_close_date', $targetDate)->get();

            if ($deals->isEmpty()) {
                $this->info("No deals expiring in {$days} days.");
                continue;
            }

            $count = 0;
            foreach ($deals as $deal) {
                $recipients = $admins->merge(
                    $deal->pic_user_id ? [User::find($deal->pic_user_id)] : []
                )->unique('id');
                Notification::send($recipients, new DealDeadlineNotification($deal, $days));
                $count++;
            }
            $this->info("Sent notifications for {$count} deals expiring in {$days} days.");
        }

        // ── 2. Check per-stage deadlines (3 days and on due date) ──
        $stageDeadlines = [3, 0];
        foreach ($stageDeadlines as $days) {
            $targetDate = Carbon::now()->addDays($days)->toDateString();

            $deadlines = DealStageDeadline::with('deal')
                ->where('is_completed', false)
                ->whereDate('end_date', $targetDate)
                ->get();

            if ($deadlines->isEmpty()) {
                $this->info("No stage deadlines expiring in {$days} days.");
                continue;
            }

            $count = 0;
            foreach ($deadlines as $deadline) {
                if (!$deadline->deal) continue;

                $stageName = PipelineStage::where('code', $deadline->stage_code)
                    ->where('pipeline_type', $deadline->pipeline_type)
                    ->value('name') ?? $deadline->stage_code;

                $recipients = $admins->merge(
                    $deadline->deal->pic_user_id ? [User::find($deadline->deal->pic_user_id)] : []
                )->unique('id');

                Notification::send($recipients, new DealDeadlineNotification(
                    $deadline->deal,
                    $days,
                    $stageName,
                    'approaching'
                ));
                $count++;
            }
            $this->info("Sent stage deadline notifications for {$count} stages expiring in {$days} days.");
        }

        // ── 3. Check for overdue stage deadlines ──
        $overdueDeadlines = DealStageDeadline::with('deal')
            ->overdue()
            ->whereDate('end_date', Carbon::yesterday()->toDateString()) // Only notify once (day after deadline)
            ->get();

        if ($overdueDeadlines->isNotEmpty()) {
            $count = 0;
            foreach ($overdueDeadlines as $deadline) {
                if (!$deadline->deal) continue;

                $stageName = PipelineStage::where('code', $deadline->stage_code)
                    ->where('pipeline_type', $deadline->pipeline_type)
                    ->value('name') ?? $deadline->stage_code;

                $recipients = $admins->merge(
                    $deadline->deal->pic_user_id ? [User::find($deadline->deal->pic_user_id)] : []
                )->unique('id');

                Notification::send($recipients, new DealDeadlineNotification(
                    $deadline->deal,
                    0,
                    $stageName,
                    'overdue'
                ));
                $count++;
            }
            $this->info("Sent overdue notifications for {$count} stage deadlines.");
        }

        $this->info('Deadline check complete.');
    }
}
