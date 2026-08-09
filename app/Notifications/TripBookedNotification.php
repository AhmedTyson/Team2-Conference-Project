<?php

namespace App\Notifications;

use App\Models\Trips\Trip;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TripBookedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Trip $trip) {}

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Trip Booked Successfully')
            ->line('Your trip "'. $this->trip->title . '" has been successfully booked.')
            ->action('View Trip', url('/trips/'.$this->trip->id))
            ->line('Get ready for your adventure!');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'trip_booked',
            'trip_id' => $this->trip->id,
            'title' => 'Trip Booked',
            'message' => 'Your trip "'. $this->trip->title . '" has been successfully booked.',
        ];
    }
}
