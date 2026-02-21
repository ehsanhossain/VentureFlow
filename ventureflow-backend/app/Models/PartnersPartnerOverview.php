<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnersPartnerOverview extends Model
{
    use HasFactory;

    protected $table = 'partners_partner_overviews';

    protected $fillable = [
        'reg_name',
        'hq_country',
        'company_type',
        'year_founded',
        'main_countries',
        'niche_industry',
        'current_employee_count',
        'our_contact_person',
        'company_email',
        'company_phone',
        'hq_address',
        'shareholder_name',
        'contact_person_name',
        'contact_person_position',
        'contact_person_email',
        'contact_person_phone',
        'website',
        'linkedin',
        'twitter',
        'facebook',
        'instagram',
        'youtube',
        'details',
        'no_pic_needed',
    ];

    protected $casts = [

        'main_countries' => 'array',
        'niche_industry' => 'array',
        'hq_address' => 'array',
        'shareholder_name' => 'array',
        'contact_person_phone' => 'array',
    ];

    public function country()
    {
        return $this->belongsTo(Country::class, 'hq_country');
    }

    public function hqCountry()
    {
        return $this->country();
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'our_contact_person');
    }
}
