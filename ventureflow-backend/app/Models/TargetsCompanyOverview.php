<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TargetsCompanyOverview extends Model
{
    use HasFactory;

    protected $table = 'sellers_company_overviews';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'reg_name',
        'hq_country',
        'company_type',
        'year_founded',
        'industry_ops',
        'niche_industry',
        'local_industry_code',
        'op_countries',
        'emp_total',
        'emp_full_time',
        'company_rank',
        'reason_ma',
        'synergies',
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
        'contacts',
        'website',
        'website_links',
        'introduced_projects',
        'linkedin',
        'twitter',
        'facebook',
        'instagram',
        'youtube',
        'teaser_link',
        'financial_advisor',
        'internal_pic',
        'channel',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'industry_ops' => 'array',
        'niche_industry' => 'array',
        'op_countries' => 'array',
        'hq_address' => 'array',
        'seller_phone' => 'array',
        'contacts' => 'array',
        'website_links' => 'array',
        'introduced_projects' => 'array',
        'no_pic_needed' => 'boolean',
        'shareholder_name' => 'array',
        'incharge_name' => 'array',
        'financial_advisor' => 'array',
        'internal_pic' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Define the relationship with the Country model for the HQ country.
     */
    public function hqCountry(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'hq_country');
    }
}
