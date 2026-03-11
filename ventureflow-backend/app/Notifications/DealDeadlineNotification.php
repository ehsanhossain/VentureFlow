<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DealDeadlineNotification extends Notification
{
    use Queueable;

    protected $deal;
    protected $daysLeft;
    protected $stageName;
    protected $type;

    /**
     * @param  mixed  $deal
     * @param  int    $daysLeft
     * @param  string|null  $stageName  Pipeline stage name (null = overall deal deadline)
     * @param  string  $type  'approaching' | 'overdue'
     */
    public function __construct($deal, $daysLeft, ?string $stageName = null, string $type = 'approaching')
    {
        $this->deal = $deal;
        $this->daysLeft = $daysLeft;
        $this->stageName = $stageName;
        $this->type = $type;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        if ($this->type === 'overdue') {
            $title = $this->stageName
                ? "Stage Deadline Overdue"
                : "Deal Deadline Overdue";
            $message = $this->stageName
                ? "'{$this->stageName}' stage for deal '{$this->deal->name}' is overdue."
                : "Deal '{$this->deal->name}' deadline is overdue.";
        } else {
            $title = $this->stageName
                ? "Stage Deadline Approaching"
                : "Deal Deadline Approaching";
            $message = $this->stageName
                ? "'{$this->stageName}' stage for deal '{$this->deal->name}' is due in {$this->daysLeft} days."
                : "Deal '{$this->deal->name}' is due in {$this->daysLeft} days.";
        }

        return [
            'title' => $title,
            'message' => $message,
            'type' => 'deadline',
            'entity_type' => 'deadline',
            'entity_id' => $this->deal->id,
            'days_left' => $this->daysLeft,
            'stage_name' => $this->stageName,
            'deadline_type' => $this->type,
            'link' => "/deal-pipeline",
            'entities' => [$this->deal->name],
            'actor_name' => 'System',
            'actor_avatar' => null,
        ];
    }
}
