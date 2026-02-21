<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvestorsTargetPreferences extends Model
{
    protected $table = 'buyers_target_preferences';

    protected $fillable = [
        'b_ind_prefs',
        'n_ind_prefs',
        'target_countries',
        'main_market',
        'emp_count_range',
        'mgmt_retention',
        'years_in_biz',
        'timeline',
        'company_type',
        'cert',
    ];

    protected $casts = [
        'b_ind_prefs' => 'array',
        'n_ind_prefs' => 'array',
        'target_countries' => 'array',
        'cert' => 'array',
    ];
}
