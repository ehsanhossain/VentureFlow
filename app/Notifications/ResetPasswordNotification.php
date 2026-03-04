<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends Notification
{
    /**
     * The password reset URL.
     */
    public string $url;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $url)
    {
        $this->url = $url;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        // Build the reset icon URL — served via the FileServeController
        $baseUrl = rtrim(env('APP_URL', 'http://localhost:8000'), '/');
        $resetIconUrl = $baseUrl . '/api/files/email-assets/reset%20logo.png';

        return (new MailMessage)
            ->subject('Reset Your Password - VentureFlow')
            ->view('emails.reset-password', [
                'url' => $this->url,
                'resetIconUrl' => $resetIconUrl,
            ]);
    }
}
