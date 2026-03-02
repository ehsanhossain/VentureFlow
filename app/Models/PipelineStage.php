<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PipelineStage extends Model
{
    use HasFactory;

    protected $table = 'pipeline_stages';

    protected $fillable = [
        'pipeline_type',
        'code',
        'name',
        'progress',
        'order_index',
        'is_active',
        'gate_rules',
        'monetization_config',
    ];

    protected $casts = [
        'progress' => 'integer',
        'order_index' => 'integer',
        'is_active' => 'boolean',
        'gate_rules' => 'array',
        'monetization_config' => 'array',
    ];
}
