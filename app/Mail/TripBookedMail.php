<?php

namespace App\Mail;

use App\Models\Trips\Trip;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TripBookedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Trip $trip) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Trip is Booked — ' . $this->trip->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.trip-booked',
        );
    }
}
