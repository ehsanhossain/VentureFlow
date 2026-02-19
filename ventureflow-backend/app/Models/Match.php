<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Match extends Model
{
    protected $table = 'matches';

    protected $fillable = [
        'buyer_id',
        'seller_id',
        'total_score',
        'industry_score',
        'geography_score',
        'financial_score',
        'profile_score',
        'timeline_score',
        'ownership_score',
        'status',
        'reviewed_by',
        'deal_id',
        'notes',
        'computed_at',
    ];

    protected $casts = [
        'total_score'      => 'integer',
        'industry_score'   => 'float',
        'geography_score'  => 'float',
        'financial_score'  => 'float',
        'profile_score'    => 'float',
        'timeline_score'   => 'float',
        'ownership_score'  => 'float',
        'computed_at'      => 'datetime',
    ];

    // ─── Relationships ──────────────────────────────────────────────────

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(Buyer::class, 'buyer_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(Seller::class, 'seller_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class, 'deal_id');
    }

    // ─── Helpers ────────────────────────────────────────────────────────

    public function getTierAttribute(): string
    {
        if ($this->total_score >= 90) return 'excellent';
        if ($this->total_score >= 80) return 'strong';
        if ($this->total_score >= 70) return 'good';
        if ($this->total_score >= 60) return 'fair';
        return 'low';
    }

    public function getTierLabelAttribute(): string
    {
        return match ($this->tier) {
            'excellent' => 'Excellent Match',
            'strong'    => 'Strong Match',
            'good'      => 'Good Match',
            'fair'      => 'Fair Match',
            default     => 'Low Match',
        };
    }

    // ─── Scopes ─────────────────────────────────────────────────────────

    public function scopeMinScore($query, int $minScore)
    {
        return $query->where('total_score', '>=', $minScore);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['pending', 'reviewed']);
    }

    public function scopeNotDismissed($query)
    {
        return $query->where('status', '!=', 'dismissed');
    }
}
