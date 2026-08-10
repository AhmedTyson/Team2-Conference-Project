<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class BookingItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'itemable_type',
        'itemable_id',
        'quantity',
        'unit_price_cents',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price_cents' => 'integer',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    // Resolves to Hotel, Flight, Restaurant, Attraction, or Experience
    public function itemable(): MorphTo
    {
        return $this->morphTo();
    }

    public function getSubtotalCentsAttribute(): int
    {
        return $this->quantity * $this->unit_price_cents;
    }
}