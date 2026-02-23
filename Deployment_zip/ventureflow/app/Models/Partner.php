<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Partner extends Model
{
    use HasFactory;

    protected $table = 'partners';

    protected $fillable = [
        'partner_id',
        'partner_image',
        'partnership_structure_id',
        'partner_overview_id',
        'user_id',
        'status',
    ];

    public function partnershipStructure()
    {
        return $this->belongsTo(PartnersPartnershipStructure::class, 'partnership_structure_id');
    }

    public function partnerOverview()
    {
        return $this->belongsTo(PartnersPartnerOverview::class, 'partner_overview_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
