<?php

namespace App\Mail;

use App\Models\Account\User;
use App\Models\Commerce\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionActivatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public Subscription $subscription) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Subscription is Active!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.subscription-activated',
        );
    }
}
