<?php

namespace App\Listeners;

use App\Events\PaymentFailed;
use App\Notifications\PaymentFailedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class HandlePaymentFailed implements ShouldQueue
{
    public function handle(PaymentFailed $event): void
    {
        $payment = $event->payment;
        $order = $payment->order;

        if (! $order || ! $order->user) {
            return;
        }

        try {
            $order->user->notify(new PaymentFailedNotification($order));
        } catch (\Throwable $e) {
            Log::error('Payment failed notification could not be sent', [
                'order_id' => $order->id,
                'exception' => $e->getMessage(),
            ]);
        }
    }
}
