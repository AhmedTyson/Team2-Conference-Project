<?php

namespace App\Mail;

use App\Models\Trip;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TripForkedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Trip $forkedTrip, public Trip $originalTrip) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Someone forked your trip!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.trip-forked',
        );
    }
}
