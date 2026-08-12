<?php

namespace App\Notifications;

use App\Mail\BookingCancelledMail;
use App\Models\Commerce\Order;

class BookingCancelledNotification extends AppNotification
{
    public function __construct(public Order $order) {}

    public function toMail(object $notifiable)
    {
        return (new BookingCancelledMail($this->order))
            ->to($notifiable->email);
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'     => 'booking_cancelled',
            'order_id' => $this->order->id,
            'message'  => 'Your booking for Order #' . $this->order->id . ' has been cancelled.',
        ];
    }

    protected function getNotifiableId(): string
    {
        return 'cancel-' . $this->order->id;
    }
}
