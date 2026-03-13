<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class DealStageDeadline extends Model
{
    protected $fillable = [
        'deal_id',
        'stage_code',
        'pipeline_type',
        'start_date',
        'end_date',
        'is_parallel',
        'is_completed',
        'completed_at',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'is_parallel' => 'boolean',
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    /**
     * Scope: deadlines that have passed their end_date and are not completed.
     */
    public function scopeOverdue($query)
    {
        return $query->where('end_date', '<', Carbon::today())
                     ->where('is_completed', false);
    }

    /**
     * Scope: deadlines due within the next N days (not completed).
     */
    public function scopeUpcoming($query, int $days = 30)
    {
        return $query->where('is_completed', false)
                     ->where('end_date', '>=', Carbon::today())
                     ->where('end_date', '<=', Carbon::today()->addDays($days));
    }

    /**
     * Scope: deadlines for active (non-completed) stages.
     */
    public function scopeActive($query)
    {
        return $query->where('is_completed', false);
    }
}
