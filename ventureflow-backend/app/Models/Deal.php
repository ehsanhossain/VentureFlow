<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Deal extends Model
{
    use HasFactory;

    protected $fillable = [
        'buyer_id',
        'seller_id',
        'name',
        'industry',
        'region',
        'ticket_size',
        'estimated_ev_value',
        'estimated_ev_currency',
        'stage_code',
        'progress_percent',
        'priority',
        'possibility',
        'pic_user_id',
        'internal_pic',
        'target_close_date',
        'status',
        'lost_reason',
        'comment_count',
        'attachment_count',
    ];

    protected $casts = [
        'estimated_ev_value' => 'decimal:2',
        'ticket_size' => 'decimal:2',
        'target_close_date' => 'date',
        'internal_pic' => 'array',
    ];

    protected $appends = ['stage_name', 'stage_progress'];

    public function getStageNameAttribute()
    {
        return $this->getStageName();
    }

    public function getStageProgressAttribute()
    {
        return $this->getStageProgress();
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(Buyer::class, 'buyer_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(Seller::class, 'seller_id');
    }

    public function pic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pic_user_id');
    }

    public function stageHistory(): HasMany
    {
        return $this->hasMany(DealStageHistory::class)->orderBy('changed_at', 'desc');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(DealDocument::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(DealComment::class)->orderBy('created_at', 'desc');
    }

    public function getStageName(?string $side = null)
    {
        if (!$side) {
            $side = $this->buyer_id ? 'buyer' : 'seller'; 
        }

        $stage = PipelineStage::where('pipeline_type', $side)
                             ->where('code', $this->stage_code)
                             ->first();

        return $stage ? $stage->name : ($this->stage_code ?? '');
    }

    public function getStageProgress(?string $side = null)
    {
        if (!$side) {
            $side = $this->buyer_id ? 'buyer' : 'seller';
        }

        $stage = PipelineStage::where('pipeline_type', $side)
                             ->where('code', $this->stage_code)
                             ->first();

        return $stage ? $stage->progress : ($this->progress_percent ?? 0);
    }

    public function activityLogs(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'loggable');
    }
}
