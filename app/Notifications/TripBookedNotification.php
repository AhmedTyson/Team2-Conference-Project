<?php

namespace App\Notifications;

use App\Mail\TripBookedMail;
use App\Models\Trips\Trip;

class TripBookedNotification extends AppNotification
{
    public function __construct(public Trip $trip) {}

    public function toMail(object $notifiable)
    {
        return (new TripBookedMail($this->trip))
            ->to($notifiable->email);
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'    => 'trip_booked',
            'trip_id' => $this->trip->id,
            'title'   => 'Trip Booked',
            'message' => 'Your trip "' . $this->trip->title . '" has been successfully booked.',
        ];
    }

    protected function getNotifiableId(): string
    {
        return (string) $this->trip->id;
    }
}
