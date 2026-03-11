<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DriveShare extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'drive_shares';

    protected $fillable = [
        'id',
        'file_id',
        'folder_id',
        'share_token',
        'password_hash',
        'expires_at',
        'is_active',
        'access_count',
        'max_access_count',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'access_count' => 'integer',
        'max_access_count' => 'integer',
        'expires_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            if (empty($model->share_token)) {
                $model->share_token = bin2hex(random_bytes(32));
            }
        });
    }

    // ── Relationships ──

    public function file(): BelongsTo
    {
        return $this->belongsTo(DriveFile::class, 'file_id');
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(DriveFolder::class, 'folder_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Security Helpers ──

    /**
     * Check if the share link has expired.
     */
    public function isExpired(): bool
    {
        if (!$this->expires_at) {
            return false;
        }
        return $this->expires_at->isPast();
    }

    /**
     * Check if the access limit has been reached.
     */
    public function isAccessLimitReached(): bool
    {
        if (!$this->max_access_count) {
            return false;
        }
        return $this->access_count >= $this->max_access_count;
    }

    /**
     * Check if this share requires a password.
     */
    public function requiresPassword(): bool
    {
        return !empty($this->password_hash);
    }

    /**
     * Verify a plaintext password against the stored hash.
     */
    public function verifyPassword(string $plaintext): bool
    {
        if (!$this->requiresPassword()) {
            return true;
        }
        return Hash::check($plaintext, $this->password_hash);
    }

    /**
     * Atomically increment the access counter.
     */
    public function incrementAccessCount(): void
    {
        $this->increment('access_count');
    }

    /**
     * Check if this share is currently valid (active, not expired, not over limit).
     */
    public function isValid(): bool
    {
        return $this->is_active && !$this->isExpired() && !$this->isAccessLimitReached();
    }
}
