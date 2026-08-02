<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
            'departure_date' => 'datetime',
            'arrival_date' => 'datetime',
        ];
    }

    public function trips(): MorphToMany { return $this->morphToMany(Trip::class, 'item', 'trip_items')->withTimestamps(); }
}


