<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvestorsFinancialDetails extends Model
{
    protected $table = 'buyers_financial_details';

    protected $fillable = [
        'default_currency',
        'register_currency',
        'related_country',
        'investment_budget',
        'ebitda_margin_latest',
        'ebitda_multiple',
        'expected_ebitda',
        'profit_multiple',
        'ttm_revenue',
        'ttm_profit',
        'ma_structure',
        'acquire_pct',
        'shareholding',
        'is_minority',
        'is_majority',
        'is_negotiable',
        'ownership_type',
        'valuation',
        'growth_rate_yoy',
        'revenue_growth_avg_3y',
        'profit_criteria',
    ];

    protected $casts = [
        'investment_budget' => 'array',
        'ebitda_multiple' => 'array',
        'expected_ebitda' => 'array',
        'profit_multiple' => 'array',
        'ttm_revenue' => 'array',
        'ttm_profit' => 'array',
        'acquire_pct' => 'array',
        'valuation' => 'array',
        'is_minority' => 'boolean',
        'is_majority' => 'boolean',
        'is_negotiable' => 'boolean',
    ];
}
