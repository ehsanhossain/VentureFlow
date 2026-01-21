<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Buyer extends Model
{
    use HasFactory;

    protected $table = 'buyers';

    protected $fillable = [
        'buyer_id',
        'company_overview_id',
        'target_preference_id',
        'financial_detail_id',
        'partnership_detail_id',
        'teaser_center_id',
    ];

    /**
     * Relationship to the company overview.
     */
    public function companyOverview(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(BuyersCompanyOverview::class, 'company_overview_id');
    }

    /**
     * Relationship to the target preferences.
     */
    public function targetPreference(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(BuyersTargetPreferences::class, 'target_preference_id');
    }

    /**
     * Relationship to the financial details.
     */
    public function financialDetails(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(BuyersFinancialDetails::class, 'financial_detail_id');
    }

    /**
     * Relationship to the partnership details.
     */
    public function partnershipDetails(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(BuyersPartnershipDetails::class, 'partnership_detail_id');
    }

    /**
     * Relationship to the teaser center.
     */
    public function teaserCenter(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(BuyersTeaserCenters::class, 'teaser_center_id');
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
