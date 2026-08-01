<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TripDestination extends Model
{
    use HasFactory;

    protected $fillable = [
        'trip_id', 'destination_id', 'day_number', 'visit_order', 'estimated_date', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'estimated_date' => 'date',
        ];
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }
}
