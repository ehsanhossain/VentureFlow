<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvestorsPartnershipDetails extends Model
{
    protected $table = 'buyers_partnership_details';

    protected $fillable = [
        'partnership_affiliation',
        'partner',
        'referral_bonus_criteria',
        'referral_bonus_amount',
        'mou_status',
        'specific_remarks',
    ];

    public function partner(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Partner::class, 'partner');
    }
}
