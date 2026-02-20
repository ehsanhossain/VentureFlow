<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Investor extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     * Keeping 'buyers' for backward DB compatibility.
     */
    protected $table = 'buyers';

    protected $fillable = [
        'buyer_id',
        'company_overview_id',
        'target_preference_id',
        'financial_detail_id',
        'partnership_detail_id',
        'teaser_center_id',
        'status',
    ];

    /**
     * Relationship to the company overview.
     */
    public function companyOverview(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(InvestorsCompanyOverview::class, 'company_overview_id');
    }

    /**
     * Relationship to the target preferences.
     */
    public function targetPreference(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(InvestorsTargetPreferences::class, 'target_preference_id');
    }

    /**
     * Relationship to the financial details.
     */
    public function financialDetails(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(InvestorsFinancialDetails::class, 'financial_detail_id');
    }

    /**
     * Relationship to the partnership details.
     */
    public function partnershipDetails(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(InvestorsPartnershipDetails::class, 'partnership_detail_id');
    }

    /**
     * Relationship to the teaser center.
     */
    public function teaserCenter(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(InvestorsTeaserCenter::class, 'teaser_center_id');
    }

    /**
     * Relationship to the deals.
     */
    public function deals(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Deal::class, 'buyer_id');
    }

    public function activityLogs(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'loggable');
    }
}
