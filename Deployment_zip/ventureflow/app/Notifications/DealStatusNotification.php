<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DealStatusNotification extends Notification
{
    use Queueable;

    protected $deal;
    protected $action; // 'created', 'updated', 'stage_changed'
    protected $extra;  // Additional context data
    protected $actor;  // The user who triggered the action

    public function __construct($deal, $action = 'updated', array $extra = [], $actor = null)
    {
        $this->deal = $deal;
        $this->action = $action;
        $this->extra = $extra;
        $this->actor = $actor;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $title = "Deal Update: #{$this->deal->id}";
        $message = "Deal '{$this->deal->name}' has been updated.";

        // Collect entity names that should be bold on the frontend
        $entities = [];

        if ($this->action === 'created') {
            $title = "New Deal Created";
            $message = "A new deal '{$this->deal->name}' has been created.";
            $entities[] = $this->deal->name;
        } elseif ($this->action === 'stage_changed') {
            $investorName = $this->extra['investor_name'] ?? 'Unknown Investor';
            $sellerName = $this->extra['seller_name'] ?? 'Unknown Seller';
            $toStageName = $this->extra['to_stage_name'] ?? $this->deal->stage_code;
            $fromStageName = $this->extra['from_stage_name'] ?? '—';

            $title = "Deal Stage Changed";
            $message = "Deal where {$investorName} has interest in {$sellerName} moved from {$fromStageName} to {$toStageName}.";
            $entities = [$investorName, $sellerName, $fromStageName, $toStageName];
        }

        $data = [
            'title' => $title,
            'message' => $message,
            'type' => 'deal',
            'icon' => 'deal-pipeline',
            'entity_type' => 'deal',
            'entity_id' => $this->deal->id,
            'link' => "/deal-pipeline",
            'entities' => $entities,
        ];

        // Attach actor info if available
        if ($this->actor) {
            $data['actor_name'] = trim(($this->actor->employee->first_name ?? '') . ' ' . ($this->actor->employee->last_name ?? '')) ?: ($this->actor->name ?? 'System');
            $empImage = $this->actor->employee->image ?? null;
            $data['actor_avatar'] = $empImage ? asset('storage/' . $empImage) : null;
        }

        return $data;
    }
}
