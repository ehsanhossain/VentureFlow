<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FeeTier extends Model
{
    use HasFactory;

    protected $table = 'fee_tiers';

    protected $fillable = [
        'fee_type',
        'min_amount',
        'max_amount',
        'success_fee_fixed',
        'success_fee_rate',
        'retainer_details',
        'fee_constraints',
        'order_index',
        'is_active',
    ];

    protected $casts = [
        'min_amount' => 'float',
        'max_amount' => 'float',
        'success_fee_fixed' => 'float',
        'success_fee_rate' => 'float',
        'order_index' => 'integer',
        'is_active' => 'boolean',
    ];
}
