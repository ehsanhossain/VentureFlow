<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    protected $fillable = [
        'name',
        'alpha_2_code',
        'alpha_3_code',
        'numeric_code',
        'svg_icon',
        'is_region',
    ];

    protected $casts = [
        'is_region' => 'boolean',
    ];

    protected $appends = ['svg_icon_url'];

    /**
     * Get the full flag CDN URL from the alpha_2_code,
     * or a globe icon URL for regions.
     */
    public function getSvgIconUrlAttribute(): string
    {
        // Regions don't have flag codes — use region-specific SVGs
        if ($this->is_region || empty($this->alpha_2_code)) {
            $name = strtolower($this->name ?? '');

            // Map region names to specific SVG icon files
            $asiaRegions = ['asean', 'east asia', 'south asia', 'central asia', 'oceania', 'asia pacific', 'apac'];
            $europeRegions = ['europe', 'nordic countries', 'eu'];
            $americaRegions = ['north america', 'south america', 'americas', 'latin america'];
            $middleEastRegions = ['middle east', 'gcc', 'mena'];

            if (in_array($name, $asiaRegions)) {
                $file = 'Asia.svg';
            } elseif (in_array($name, $europeRegions)) {
                $file = 'Europe.svg';
            } elseif (in_array($name, $americaRegions)) {
                $file = 'USA.svg';
            } elseif (in_array($name, $middleEastRegions)) {
                $file = 'Asia.svg'; // Use Asia icon for Middle East proximity
            } else {
                $file = 'Global and others.svg';
            }

            return url("/images/regions/{$file}");
        }

        return 'https://flagcdn.com/' . strtolower($this->alpha_2_code) . '.svg';
    }

    /**
     * Scope to filter only actual countries (not regions).
     */
    public function scopeCountriesOnly($query)
    {
        return $query->where('is_region', false);
    }

    /**
     * Scope to filter only regions.
     */
    public function scopeRegionsOnly($query)
    {
        return $query->where('is_region', true);
    }
}
