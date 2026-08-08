<?php

namespace App\Notifications;

use App\Models\Subscription;
use App\Mail\SubscriptionActivatedMail;

class SubscriptionActivatedNotification extends AppNotification
{
    public function __construct(public Subscription $subscription)
    {
    }

    public function toMail(object $notifiable)
    {
        return (new SubscriptionActivatedMail($notifiable, $this->subscription))
                    ->to($notifiable->email);
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'subscription_id' => $this->subscription->id,
            'plan_name' => $this->subscription->plan->name ?? 'Premium',
            'message' => 'Your subscription has been successfully activated.',
        ];
    }

    protected function getNotifiableId(): string
    {
        return (string) $this->subscription->id;
    }
}
