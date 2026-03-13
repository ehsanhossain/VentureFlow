<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class PartnerUser extends Pivot
{
    protected $table = 'partner_users';

    protected $fillable = [
        'partner_id',
        'user_id',
        'label',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
