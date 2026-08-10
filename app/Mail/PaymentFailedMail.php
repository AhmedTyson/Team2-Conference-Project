<?php

namespace App\Mail;

use App\Models\Account\User;
use App\Models\Commerce\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentFailedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Payment Failed Notification',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-failed',
        );
    }
}
