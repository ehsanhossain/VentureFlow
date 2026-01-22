<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BuyersCompanyOverview extends Model
{
    use HasFactory;

    protected $table = 'buyers_company_overviews';

    protected $fillable = [
        'reg_name',
        'hq_country',
        'company_type',
        'year_founded',
        'industry_ops',
        'main_industry_operations',
        'niche_industry',
        'emp_count',
        'reason_ma',
        'proj_start_date',
        'txn_timeline',
        'incharge_name',
        'no_pic_needed',
        'status',
        'details',
        'email',
        'phone',
        'hq_address',
        'shareholder_name',
        'seller_contact_name',
        'seller_designation',
        'seller_email',
        'seller_phone',
        'website',
        'linkedin',
        'twitter',
        'facebook',
        'instagram',
        'youtube',
        'buyer_image',
        'profile_picture',
        'rank',
        'contacts',
        'investment_budget',
        'investment_condition',
        'target_countries',
        'investor_profile_link',
        'introduced_projects',
    ];

    protected $casts = [
        'main_industry_operations' => 'array',
        'niche_industry' => 'array',
        'shareholder_name' => 'array',
        'hq_address' => 'array',
        'seller_phone' => 'array',
        'no_pic_needed' => 'boolean',
        'contacts' => 'array',
        'investment_budget' => 'array',
        'target_countries' => 'array',
        'introduced_projects' => 'array',
    ];

    // Relationship with the Buyer (assuming buyer_id references buyers table)
    public function buyer()
    {
        return $this->belongsTo(Buyer::class, 'buyer_id');
    }

    // Relationship with Country (hq_country references countries table)
    public function hqCountry()
    {
        return $this->belongsTo(Country::class, 'hq_country');
    }
    
    public function employeeDetails(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'incharge_name');
    }
}
