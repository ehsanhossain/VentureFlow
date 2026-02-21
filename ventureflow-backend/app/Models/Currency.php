<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    protected $fillable = [
        'currency_name',
        'currency_code',
        'currency_sign',
        'origin_country',
        'dollar_unit',
        'exchange_rate',
        'source',
    ];
}
