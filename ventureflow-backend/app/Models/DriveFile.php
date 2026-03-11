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

class DriveFile extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'drive_files';

    protected $fillable = [
        'id',
        'original_name',
        'storage_path',
        'mime_type',
        'size',
        'folder_id',
        'prospect_type',
        'prospect_id',
        'version',
        'uploaded_by',
    ];

    protected $casts = [
        'size' => 'integer',
        'version' => 'integer',
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

    public function folder(): BelongsTo
    {
        return $this->belongsTo(DriveFolder::class, 'folder_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(DriveFileVersion::class, 'file_id')->orderBy('version_number', 'desc');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(DriveComment::class, 'file_id')->orderBy('created_at', 'desc');
    }

    public function shares(): HasMany
    {
        return $this->hasMany(DriveShare::class, 'file_id');
    }

    // ── Scopes ──

    public function scopeForProspect($query, string $type, int $prospectId)
    {
        return $query->where('prospect_type', $type)->where('prospect_id', $prospectId);
    }

    public function scopeInFolder($query, ?string $folderId)
    {
        if ($folderId) {
            return $query->where('folder_id', $folderId);
        }
        return $query->whereNull('folder_id');
    }

    // ── Helpers ──

    /**
     * Check if this file type is previewable in the browser.
     */
    public function isPreviewable(): bool
    {
        $previewable = [
            'application/pdf',
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'video/mp4', 'video/webm',
            'text/plain', 'text/html', 'text/csv',
            // Excel
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            // Word
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        ];
        return in_array($this->mime_type, $previewable);
    }
}
