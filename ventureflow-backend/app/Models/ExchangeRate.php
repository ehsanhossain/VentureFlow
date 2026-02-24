<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    protected $fillable = [
        'currency_code',
        'rate_to_usd',
    ];

    protected $casts = [
        'rate_to_usd' => 'float',
    ];

    /**
     * Convert an amount from a given currency to USD.
     */
    public static function toUsd(float $amount, ?string $currencyCode): float
    {
        if (!$currencyCode || strtoupper($currencyCode) === 'USD') {
            return $amount;
        }

        $rate = static::where('currency_code', strtoupper($currencyCode))->value('rate_to_usd');

        // If no rate found, assume 1:1 (no conversion)
        return $amount * ($rate ?? 1.0);
    }
}
