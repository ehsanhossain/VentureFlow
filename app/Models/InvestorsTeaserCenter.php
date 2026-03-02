<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvestorsTeaserCenter extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'buyers_teaser_centers';

    protected $fillable = [
        'teaser_name',
        'teaser_link',
        'teaser_description',
        'has_teaser_name',
        'has_industry',
        'has_buyer_targeted_countries',
        'has_emp_count_range',
        'has_expected_ebitda',
        'has_acquiring_percentage',
        'has_valuation_range',
        'has_investment_amount',
        'has_growth_rate_yoy',
        'has_border_industry_preference',
        'has_teaser_description',
        'teaser_params',
    ];

    protected $casts = [
        'has_teaser_name'               => 'boolean',
        'has_industry'                  => 'boolean',
        'has_buyer_targeted_countries'  => 'boolean',
        'has_emp_count_range'           => 'boolean',
        'has_expected_ebitda'           => 'boolean',
        'has_acquiring_percentage'      => 'boolean',
        'has_valuation_range'           => 'boolean',
        'has_investment_amount'         => 'boolean',
        'has_growth_rate_yoy'           => 'boolean',
        'has_border_industry_preference'=> 'boolean',
        'has_teaser_description'        => 'boolean',
        'teaser_params'                 => 'array',
    ];

    /**
     * Relationship back to the investor.
     */
    public function investor()
    {
        return $this->hasOne(Investor::class, 'teaser_center_id');
    }
}
