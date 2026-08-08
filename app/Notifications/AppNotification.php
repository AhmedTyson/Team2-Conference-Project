<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Middleware\WithoutOverlapping;

abstract class AppNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail']; // Default to in-app database AND mail
    }

    /**
     * Prevent duplicate notifications (idempotency)
     */
    public function middleware()
    {
        return [
            // Prevent overlapping for identical notifications for 5 minutes.
            // Uses the notification class name and notifiable ID as the unique lock key.
            (new WithoutOverlapping(get_class($this) . ':' . $this->getNotifiableId()))->expireAfter(300)
        ];
    }

    protected function getNotifiableId(): string
    {
        // By default, assume the notifiable object is passed or resolved later.
        // Child classes should implement or override if needed.
        return 'default';
    }
}
