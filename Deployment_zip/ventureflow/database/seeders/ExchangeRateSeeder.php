<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ExchangeRate;

class ExchangeRateSeeder extends Seeder
{
    public function run(): void
    {
        // Mid-market rates as of Feb 2026 (approximate).
        // rate_to_usd = how many USD per 1 unit of this currency.
        $rates = [
            ['currency_code' => 'USD', 'rate_to_usd' => 1.0],
            ['currency_code' => 'EUR', 'rate_to_usd' => 1.08],
            ['currency_code' => 'GBP', 'rate_to_usd' => 1.26],
            ['currency_code' => 'JPY', 'rate_to_usd' => 0.0067],
            ['currency_code' => 'CNY', 'rate_to_usd' => 0.137],
            ['currency_code' => 'KRW', 'rate_to_usd' => 0.00074],
            ['currency_code' => 'THB', 'rate_to_usd' => 0.028],
            ['currency_code' => 'BDT', 'rate_to_usd' => 0.0083],
            ['currency_code' => 'INR', 'rate_to_usd' => 0.012],
            ['currency_code' => 'SGD', 'rate_to_usd' => 0.74],
            ['currency_code' => 'MYR', 'rate_to_usd' => 0.22],
            ['currency_code' => 'IDR', 'rate_to_usd' => 0.000063],
            ['currency_code' => 'VND', 'rate_to_usd' => 0.000041],
            ['currency_code' => 'PHP', 'rate_to_usd' => 0.018],
            ['currency_code' => 'AUD', 'rate_to_usd' => 0.64],
            ['currency_code' => 'CAD', 'rate_to_usd' => 0.72],
            ['currency_code' => 'CHF', 'rate_to_usd' => 1.11],
            ['currency_code' => 'HKD', 'rate_to_usd' => 0.128],
            ['currency_code' => 'TWD', 'rate_to_usd' => 0.031],
            ['currency_code' => 'AED', 'rate_to_usd' => 0.272],
            ['currency_code' => 'SAR', 'rate_to_usd' => 0.267],
            ['currency_code' => 'NZD', 'rate_to_usd' => 0.60],
            ['currency_code' => 'SEK', 'rate_to_usd' => 0.095],
            ['currency_code' => 'NOK', 'rate_to_usd' => 0.092],
            ['currency_code' => 'DKK', 'rate_to_usd' => 0.145],
            ['currency_code' => 'ZAR', 'rate_to_usd' => 0.054],
            ['currency_code' => 'BRL', 'rate_to_usd' => 0.17],
            ['currency_code' => 'MXN', 'rate_to_usd' => 0.058],
            ['currency_code' => 'PLN', 'rate_to_usd' => 0.25],
            ['currency_code' => 'CZK', 'rate_to_usd' => 0.043],
            ['currency_code' => 'HUF', 'rate_to_usd' => 0.0027],
            ['currency_code' => 'TRY', 'rate_to_usd' => 0.031],
            ['currency_code' => 'RUB', 'rate_to_usd' => 0.011],
            ['currency_code' => 'ILS', 'rate_to_usd' => 0.28],
            ['currency_code' => 'EGP', 'rate_to_usd' => 0.020],
            ['currency_code' => 'PKR', 'rate_to_usd' => 0.0036],
            ['currency_code' => 'LKR', 'rate_to_usd' => 0.0031],
            ['currency_code' => 'MMK', 'rate_to_usd' => 0.00048],
            ['currency_code' => 'KHR', 'rate_to_usd' => 0.00024],
            ['currency_code' => 'LAK', 'rate_to_usd' => 0.000045],
        ];

        foreach ($rates as $rate) {
            ExchangeRate::updateOrCreate(
                ['currency_code' => $rate['currency_code']],
                ['rate_to_usd' => $rate['rate_to_usd']]
            );
        }
    }
}
