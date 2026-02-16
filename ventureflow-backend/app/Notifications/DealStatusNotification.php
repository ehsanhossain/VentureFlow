<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DealStatusNotification extends Notification
{
    use Queueable;

    protected $deal;
    protected $action; // 'created', 'updated', 'stage_changed'
    protected $extra;  // Additional context data

    public function __construct($deal, $action = 'updated', array $extra = [])
    {
        $this->deal = $deal;
        $this->action = $action;
        $this->extra = $extra;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $title = "Deal Update: #{$this->deal->id}";
        $message = "Deal '{$this->deal->name}' has been updated.";

        if ($this->action === 'created') {
            $title = "New Deal Created";
            $message = "A new deal '{$this->deal->name}' has been created.";
        } elseif ($this->action === 'stage_changed') {
            $investorName = $this->extra['investor_name'] ?? 'Unknown Investor';
            $sellerName = $this->extra['seller_name'] ?? 'Unknown Seller';
            $toStageName = $this->extra['to_stage_name'] ?? $this->deal->stage_code;
            $fromStageName = $this->extra['from_stage_name'] ?? '—';

            $title = "Deal Stage Changed";
            $message = "Deal where {$investorName} has interest in {$sellerName} moved from {$fromStageName} to {$toStageName}.";
        }

        return [
            'title' => $title,
            'message' => $message,
            'type' => 'deal',
            'icon' => 'deal-pipeline',
            'entity_type' => 'deal',
            'entity_id' => $this->deal->id,
            'link' => "/deal-pipeline" // navigate to board
        ];
    }
}
