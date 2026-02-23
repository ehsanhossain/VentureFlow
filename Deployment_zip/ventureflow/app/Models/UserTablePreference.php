<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserTablePreference extends Model
{
    use HasFactory;

    protected $table = 'user_table_preferences';

    protected $fillable = [
        'user_id',
        'table_type',
        'visible_columns',
        'column_order',
    ];

    protected $casts = [
        'visible_columns' => 'array',
        'column_order'    => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
