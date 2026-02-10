<?php

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
    ];

    protected $appends = ['svg_icon_url'];

    /**
     * Get the full flag CDN URL from the alpha_2_code.
     */
    public function getSvgIconUrlAttribute(): string
    {
        return 'https://flagcdn.com/' . strtolower($this->alpha_2_code) . '.svg';
    }
}
