<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FileFolder extends Model
{
    protected $table = 'file_folders';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'folder_id',
        'file_id',
        'seller_id',
        'buyer_id',
        'partner_id',
    ];

    protected $casts = [
        'id' => 'string',
        'folder_id' => 'string',
        'file_id' => 'string',
        'seller_id' => 'integer',
        'buyer_id' => 'integer',
        'partner_id' => 'integer',
    ];


    public function seller(): BelongsTo
    {
        return $this->belongsTo(Target::class);
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(Investor::class);
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
