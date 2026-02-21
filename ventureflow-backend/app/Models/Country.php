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
        // Regions don't have flag codes — use a globe/earth SVG instead
        if ($this->is_region || empty($this->alpha_2_code)) {
            // Data URI for a simple globe SVG icon
            return 'data:image/svg+xml,' . rawurlencode(
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23064771" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
                . '<circle cx="12" cy="12" r="10"/>'
                . '<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>'
                . '<path d="M2 12h20"/>'
                . '</svg>'
            );
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
