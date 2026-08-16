<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

/**
 * SystemNotification
 *
 * Generic system-level notification used for admin alerts (e.g. flag filings,
 * complaints). Stores in-app via the database channel and sends an email.
 *
 * @date 2026-08-16
 */
class SystemNotification extends AppNotification
{
    public function __construct(
        private string $title,
        private string $body,
        private string $actionUrl = '/',
    ) {}

    // ---------------------------------------------------------------- channels

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    // ---------------------------------------------------------------- database

    public function toDatabase(object $notifiable): array
    {
        return [
            'title'      => $this->title,
            'body'       => $this->body,
            'action_url' => $this->actionUrl,
        ];
    }

    // ---------------------------------------------------------------- mail

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->title)
            ->line($this->body)
            ->action('View Details', url($this->actionUrl));
    }
}
