<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class DealStatusNotification extends Notification
{
    use Queueable;

    protected $deal;
    protected $action; // 'created', 'updated', 'stage_changed'

    public function __construct($deal, $action = 'updated')
    {
        $this->deal = $deal;
        $this->action = $action;
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
            $title = "Deal Stage Changed";
            $message = "Deal '{$this->deal->name}' moved to stage '{$this->deal->current_stage}'.";
        }

        return [
            'title' => $title,
            'message' => $message,
            'type' => 'deal',
            'entity_type' => 'deal',
            'entity_id' => $this->deal->id,
            'link' => "/deal-pipeline" // navigate to board
        ];
    }
}
