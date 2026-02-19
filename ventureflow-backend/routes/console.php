<?php

use Illuminate\Foundation\Console\ClosureCommand;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    /** @var ClosureCommand $this */
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Refresh currency exchange rates daily at midnight ──
Artisan::command('currencies:refresh', function () {
    /** @var ClosureCommand $this */
    $this->info('Refreshing exchange rates...');

    try {
        $response = \Illuminate\Support\Facades\Http::withoutVerifying()->timeout(15)
            ->get('https://open.er-api.com/v6/latest/USD');

        if (!$response->successful()) {
            $this->error('External API returned an error.');
            return 1;
        }

        $rates = $response->json()['rates'] ?? [];
        $currencies = \App\Models\Currency::all();
        $count = 0;

        foreach ($currencies as $currency) {
            $code = strtoupper($currency->currency_code);
            if (isset($rates[$code])) {
                $currency->exchange_rate = $rates[$code];
                $currency->source = 'api';
                $currency->save();
                $count++;
            }
        }

        $this->info("Updated {$count} currencies successfully.");
        return 0;
    } catch (\Exception $e) {
        $this->error('Failed: ' . $e->getMessage());
        \Illuminate\Support\Facades\Log::error('Scheduled currency refresh failed: ' . $e->getMessage());
        return 1;
    }
})->purpose('Refresh currency exchange rates from external API');

// Schedule the currency refresh to run daily at midnight UTC
Schedule::command('currencies:refresh')->daily()->withoutOverlapping()->appendOutputTo(storage_path('logs/currency-refresh.log'));

// Schedule deal deadline checks daily at 8 AM
Schedule::command('deals:check-deadlines')->dailyAt('08:00')->withoutOverlapping();
