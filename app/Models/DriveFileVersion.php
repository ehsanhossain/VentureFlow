<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class DriveFileVersion extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'drive_file_versions';

    protected $fillable = [
        'id',
        'file_id',
        'version_number',
        'storage_path',
        'size',
        'mime_type',
        'uploaded_by',
    ];

    protected $casts = [
        'size' => 'integer',
        'version_number' => 'integer',
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

    public function file(): BelongsTo
    {
        return $this->belongsTo(DriveFile::class, 'file_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
