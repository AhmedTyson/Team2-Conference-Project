<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Notifications\Messages\MailMessage;
use App\Mail\PaymentSuccessMail;

class PaymentSucceededNotification extends AppNotification
{
    public function __construct(public Order $order)
    {
    }

    public function toMail(object $notifiable)
    {
        return (new PaymentSuccessMail($notifiable, $this->order))
                    ->to($notifiable->email);
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'amount_cents' => $this->order->total_cents,
            'message' => 'Your payment was successful.',
        ];
    }

    protected function getNotifiableId(): string
    {
        return (string) $this->order->id;
    }
}
