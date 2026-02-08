<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class DealDeadlineNotification extends Notification
{
    use Queueable;

    protected $deal;
    protected $daysLeft;

    public function __construct($deal, $daysLeft)
    {
        $this->deal = $deal;
        $this->daysLeft = $daysLeft;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => "Deal Deadline Approaching",
            'message' => "Deal '{$this->deal->name}' is due in {$this->daysLeft} days.",
            'type' => 'deadline',
            'entity_type' => 'deadline',
            'entity_id' => $this->deal->id,
            'days_left' => $this->daysLeft,
            'link' => "/deal-pipeline"
        ];
    }
}
