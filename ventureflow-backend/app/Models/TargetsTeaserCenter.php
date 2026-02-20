<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TargetsTeaserCenter extends Model
{
    use HasFactory;

    protected $table = 'sellers_teaser_centers';

    protected $fillable = [
        'teaser_heading_name',
        'industry',
        'hq_origin_country_id',
        'year_founded',
        'current_employee_count',
        'company_rank',
        'selling_reason',
        'teaser_details',
        'ebitda_value',
        'monthly_revenue',
        'misp',
        'expected_investment_amount',
        'ma_structure',

        'has_industry',
        'has_rank',
        'has_teaser_description',
        'has_hq_origin_country',
        'has_expected_investment',
        'has_year_founded',
        'has_emp_count',
        'has_selling_reason',
        'has_ma_structure',
        'has_teaser_name',
        'is_industry_checked',
    ];

    protected $casts = [
        'industry' => 'array',
        'has_industry' => 'boolean',
        'has_rank' => 'boolean',
        'has_teaser_description' => 'boolean',
        'has_hq_origin_country' => 'boolean',
        'has_expected_investment' => 'boolean',
        'has_year_founded' => 'boolean',
        'has_emp_count' => 'boolean',
        'has_selling_reason' => 'boolean',
        'has_ma_structure' => 'boolean',
        'has_teaser_name' => 'boolean',
        'is_industry_checked' => 'boolean',
    ];

    /**
     * Relationship to Country model.
     */
    public function country()
    {
        return $this->belongsTo(Country::class, 'hq_origin_country');
    }
}
