<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TargetsFinancialDetail extends Model
{
    use HasFactory;

    protected $table = 'sellers_financial_details';

    protected $fillable = [
        'default_currency',
        'valuation_method',
        'monthly_revenue',
        'annual_revenue',
        'operating_profit',
        'expected_investment_amount',
        'maximum_investor_shareholding_percentage',
        'ebitda_value',
        'ebitda_times',
        'ebitda_details',
        'investment_condition',
    ];

    protected $casts = [
        'expected_investment_amount' => 'array',
        'ebitda_value' => 'array',
    ];

    // Relationship to Target (One-to-One)
    public function target()
    {
        return $this->hasOne(Target::class, 'financial_detail_id');
    }
}
