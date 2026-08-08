<?php

namespace App\Notifications;

use App\Mail\TripForkedMail;
use App\Models\Trip;

class TripForkedNotification extends AppNotification
{
    public function __construct(public Trip $forkedTrip, public Trip $originalTrip) {}

    public function toMail(object $notifiable)
    {
        return (new TripForkedMail($this->forkedTrip, $this->originalTrip))
            ->to($notifiable->email);
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'forked_trip_id' => $this->forkedTrip->id,
            'original_trip_id' => $this->originalTrip->id,
            'message' => "Your trip '{$this->originalTrip->title}' was forked by another user.",
        ];
    }

    protected function getNotifiableId(): string
    {
        return (string) $this->forkedTrip->id;
    }
}
