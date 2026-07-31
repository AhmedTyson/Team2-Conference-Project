<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Flight extends Model
{
    use HasFactory;

    protected $fillable = [
        'trip_id', 'airline', 'flight_number', 'departure_airport', 'arrival_airport',
        'departure_date', 'arrival_date', 'price', 'booking_status',
    ];

    protected function casts(): array
    {
        return [
            'departure_date' => 'datetime',
            'arrival_date' => 'datetime',
        ];
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }
}
