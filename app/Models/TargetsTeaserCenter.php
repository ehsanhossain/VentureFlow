<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TargetsTeaserCenter extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'sellers_teaser_centers';

    protected $fillable = [
        'teaser_name',
        'teaser_link',
        'teaser_description',
        'has_teaser_name',
        'has_industry',
        'has_origin_country',
        'has_emp_count_range',
        'has_ebitda_range',
        'has_investment_amount',
        'has_ownership_percentage',
        'has_asking_price',
        'has_growth_rate_yoy',
        'has_teaser_description',
        'teaser_params',
    ];

    protected $casts = [
        'has_teaser_name'          => 'boolean',
        'has_industry'             => 'boolean',
        'has_origin_country'       => 'boolean',
        'has_emp_count_range'      => 'boolean',
        'has_ebitda_range'         => 'boolean',
        'has_investment_amount'    => 'boolean',
        'has_ownership_percentage' => 'boolean',
        'has_asking_price'         => 'boolean',
        'has_growth_rate_yoy'      => 'boolean',
        'has_teaser_description'   => 'boolean',
        'teaser_params'            => 'array',
    ];

    /**
     * Relationship back to the target.
     */
    public function target()
    {
        return $this->hasOne(Target::class, 'teaser_center_id');
    }
}
