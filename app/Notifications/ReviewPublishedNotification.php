<?php

namespace App\Notifications;

use App\Mail\ReviewPublishedMail;
use App\Models\Trips\Review;

class ReviewPublishedNotification extends AppNotification
{
    public function __construct(public Review $review) {}

    public function toMail(object $notifiable)
    {
        return (new ReviewPublishedMail($this->review))
            ->to($notifiable->email);
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'      => 'review_published',
            'review_id' => $this->review->id,
            'message'   => 'Your review has been approved and is now publicly visible.',
        ];
    }

    protected function getNotifiableId(): string
    {
        return (string) $this->review->id;
    }
}
