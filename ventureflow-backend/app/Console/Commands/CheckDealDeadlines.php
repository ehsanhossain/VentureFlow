<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Deal;
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
    protected $description = 'Check for deals approaching their target close date (7 and 15 days)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking deal deadlines...');

        $deadlines = [15, 7];
        $users = User::all();

        foreach ($deadlines as $days) {
            $targetDate = Carbon::now()->addDays($days)->toDateString();

            $deals = Deal::whereDate('target_close_date', $targetDate)->get();

            if ($deals->isEmpty()) {
                $this->info("No deals expiring in {$days} days.");
                continue;
            }

            $count = 0;
            foreach ($deals as $deal) {
                // Notify all users
                Notification::send($users, new DealDeadlineNotification($deal, $days));
                $count++;
            }

            $this->info("Sent notifications for {$count} deals expiring in {$days} days.");
        }

        $this->info('Deadline check complete.');
    }
}
