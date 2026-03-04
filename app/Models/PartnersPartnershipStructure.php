<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnersPartnershipStructure extends Model
{
    use HasFactory;

    protected $table = 'partners_partnership_structures';

    protected $fillable = [
        'partnership_structure',
        'commission_criteria',
        'status',
        'partnership_coverage_range',
        'mou_status',
    ];


    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }
}
