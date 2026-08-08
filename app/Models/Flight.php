<?php

namespace App\Models;

use App\Enums\FlightStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Flight extends Model
{
    use HasFactory;

    protected $fillable = [
        'airline', 'flight_number', 'departure_airport', 'arrival_airport',
        'departure_date', 'arrival_date', 'price', 'booking_status',
    ];

    protected function casts(): array
    {
        return [
            'booking_status' => FlightStatus::class,
            'departure_date' => 'datetime',
            'arrival_date' => 'datetime',
        ];
    }

    public function trips(): MorphToMany
    {
        return $this->morphToMany(Trip::class, 'item', 'trip_items')->withTimestamps();
    }

    public function reviews(): MorphMany
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    public function itineraryItems(): MorphMany
    {
        return $this->morphMany(ItineraryItem::class, 'itemable');
    }
}
