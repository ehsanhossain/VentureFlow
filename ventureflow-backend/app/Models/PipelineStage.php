<?php

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
    ];

    protected $casts = [
        'progress' => 'integer',
        'order_index' => 'integer',
        'is_active' => 'boolean',
    ];
}
