<?php

namespace App\Mail;

use App\Models\Trips\Review;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReviewFlaggedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Review $review) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Notice: Your Review Has Been Flagged',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.review-flagged',
        );
    }
}
