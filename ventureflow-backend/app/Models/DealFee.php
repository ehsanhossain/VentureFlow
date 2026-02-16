<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DealFee extends Model
{
    use HasFactory;

    protected $table = 'deal_fees';

    protected $fillable = [
        'deal_id',
        'fee_tier_id',
        'stage_code',
        'fee_side',
        'fee_type',
        'calculated_amount',
        'final_amount',
        'deducted_from_success',
        'notes',
    ];

    protected $casts = [
        'calculated_amount' => 'float',
        'final_amount' => 'float',
        'deducted_from_success' => 'boolean',
    ];

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function feeTier(): BelongsTo
    {
        return $this->belongsTo(FeeTier::class);
    }
}
