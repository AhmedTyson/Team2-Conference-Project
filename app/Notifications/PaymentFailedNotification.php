<?php

namespace App\Notifications;

use App\Models\Order;
use App\Mail\PaymentFailedMail;

class PaymentFailedNotification extends AppNotification
{
    public function __construct(public Order $order)
    {
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'message' => 'Your recent payment attempt failed.',
        ];
    }

    public function toMail(object $notifiable)
    {
        return (new PaymentFailedMail($notifiable, $this->order))
                    ->to($notifiable->email);
    }

    protected function getNotifiableId(): string
    {
        return (string) $this->order->id;
    }
}
