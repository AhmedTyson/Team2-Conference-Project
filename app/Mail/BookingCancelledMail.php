<?php

namespace App\Mail;

use App\Models\Commerce\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingCancelledMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Booking Cancellation Confirmation — Order #'.$this->order->id,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.booking-cancelled',
        );
    }
}
