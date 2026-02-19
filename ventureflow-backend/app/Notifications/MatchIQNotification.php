<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MatchIQNotification extends Notification
{
    use Queueable;

    protected string $buyerName;
    protected string $sellerName;
    protected int $score;
    protected string $tierLabel;
    protected int $matchId;
    protected int $buyerId;
    protected int $sellerId;

    public function __construct(
        string $buyerName,
        string $sellerName,
        int $score,
        string $tierLabel,
        int $matchId,
        int $buyerId,
        int $sellerId
    ) {
        $this->buyerName = $buyerName;
        $this->sellerName = $sellerName;
        $this->score = $score;
        $this->tierLabel = $tierLabel;
        $this->matchId = $matchId;
        $this->buyerId = $buyerId;
        $this->sellerId = $sellerId;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title'       => 'New MatchIQ Suggestion',
            'message'     => "{$this->buyerName} ↔ {$this->sellerName} scored {$this->score}% — {$this->tierLabel}",
            'type'        => 'matchiq',
            'entity_type' => 'match',
            'entity_id'   => $this->matchId,
            'link'        => '/matchiq',
            'match_data'  => [
                'match_id'  => $this->matchId,
                'buyer_id'  => $this->buyerId,
                'seller_id' => $this->sellerId,
                'score'     => $this->score,
            ],
        ];
    }
}
