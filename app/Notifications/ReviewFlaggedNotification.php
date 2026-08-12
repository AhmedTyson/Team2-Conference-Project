<?php

namespace App\Notifications;

use App\Mail\ReviewFlaggedMail;
use App\Models\Trips\Review;

class ReviewFlaggedNotification extends AppNotification
{
    public function __construct(public Review $review) {}

    public function toMail(object $notifiable)
    {
        return (new ReviewFlaggedMail($this->review))
            ->to($notifiable->email);
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'      => 'review_flagged',
            'review_id' => $this->review->id,
            'message'   => 'Your review has been flagged and is under moderation review.',
        ];
    }

    protected function getNotifiableId(): string
    {
        return 'flag-' . $this->review->id;
    }
}
