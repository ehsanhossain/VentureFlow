<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class NewRegistrationNotification extends Notification
{
    use Queueable;

    protected $type;
    protected $name;
    public $entityId; // Renamed from $id to avoid conflict with Notification public $id

    /**
     * Create a new notification instance.
     *
     * @param string $type The type of registration (e.g., 'Seller', 'Buyer', 'Partner')
     * @param string $name The name of the registered entity
     * @param mixed $entityId The ID of the entity
     */
    public function __construct($type, $name, $entityId)
    {
        $this->type = $type;
        $this->name = $name;
        $this->entityId = $entityId;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        // Build the correct link based on entity type
        $link = '/prospects';
        $entityTypeLower = strtolower($this->type);
        
        if ($entityTypeLower === 'buyer') {
            $link = "/prospects/investor/{$this->entityId}";
            $entityTypeLower = 'investor';
        } elseif ($entityTypeLower === 'seller') {
            $link = "/prospects/target/{$this->entityId}";
            $entityTypeLower = 'target';
        } elseif ($entityTypeLower === 'partner') {
            $link = "/management/partners";
        }
        
        return [
            'title' => "New {$this->type} Registered",
            'message' => "A new {$this->type} named '{$this->name}' has been registered.",
            'type' => 'registration',
            'entity_type' => $entityTypeLower,
            'entity_id' => $this->entityId,
            'link' => $link
        ];
    }
}
