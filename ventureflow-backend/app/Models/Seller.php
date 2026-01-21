<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Seller extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'sellers';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'seller_id',
        'company_overview_id',
        'financial_detail_id',
        'partnership_detail_id',
        'teaser_center_id',
        'image',
    ];

    /**
     * Get the company overview associated with the seller.
     */
    public function companyOverview(): BelongsTo
    {
        return $this->belongsTo(SellersCompanyOverview::class, 'company_overview_id');
    }

    /**
     * Get the financial details associated with the seller.
     */
    public function financialDetails(): BelongsTo
    {
        return $this->belongsTo(SellersFinancialDetail::class, 'financial_detail_id');
    }

    /**
     * Get the partnership details associated with the seller.
     */
    public function partnershipDetails(): BelongsTo
    {
        return $this->belongsTo(SellersPartnershipDetail::class, 'partnership_detail_id');
    }

    /**
     * Get the teaser center associated with the seller.
     */
    public function teaserCenter(): BelongsTo
    {
        return $this->belongsTo(SellersTeaserCenter::class, 'teaser_center_id');
    }

    // --- ADDED RELATIONSHIPS ---




    public function files(): BelongsToMany
    {
        return $this->belongsToMany(File::class, 'file_folders', 'seller_id', 'file_id')
            ->withTimestamps();
    }



    public function folders(): BelongsToMany
    {
        return $this->belongsToMany(Folder::class, 'file_folders', 'seller_id', 'folder_id')
            ->withTimestamps();
    }

    /**
     * Get the deals associated with the seller.
     */
    public function deals(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Deal::class, 'seller_id');
    }

    public function activityLogs(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'loggable');
    }
}
