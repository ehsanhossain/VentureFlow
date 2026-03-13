<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class DriveFolder extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'drive_folders';

    protected $fillable = [
        'id',
        'name',
        'parent_id',
        'prospect_type',
        'prospect_id',
        'created_by',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    // ── Relationships ──

    public function parent(): BelongsTo
    {
        return $this->belongsTo(DriveFolder::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(DriveFolder::class, 'parent_id');
    }

    public function files(): HasMany
    {
        return $this->hasMany(DriveFile::class, 'folder_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scopes ──

    public function scopeForProspect($query, string $type, int $prospectId)
    {
        return $query->where('prospect_type', $type)->where('prospect_id', $prospectId);
    }

    public function scopeRootLevel($query)
    {
        return $query->whereNull('parent_id');
    }
}
