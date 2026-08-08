<?php

namespace App\Notifications;

use App\Mail\WelcomeMail;

class WelcomeNotification extends AppNotification
{
    public function __construct()
    {
    }

    public function toMail(object $notifiable)
    {
        return (new WelcomeMail($notifiable))
                    ->to($notifiable->email);
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message' => 'Welcome to our platform! Start planning your next trip.',
        ];
    }

    protected function getNotifiableId(): string
    {
        return 'welcome';
    }
}
