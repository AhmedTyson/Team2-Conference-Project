<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Hotel extends Model
{
    use HasFactory;

    protected $fillable = [
        'destination_id', 'name', 'address', 'price_per_night',
        'rating', 'stars', 'availability', 'image',
    ];

    protected function casts(): array
    {
        return [
            'availability' => 'boolean',
        ];
    }

    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    // POLYMORPHIC: reviewable (rates)
    public function reviews(): MorphMany
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    // POLYMORPHIC: itemable (refers_to, from itinerary_items)
    public function itineraryItems(): MorphMany
    {
        return $this->morphMany(ItineraryItem::class, 'itemable');
    }

    // POLYMORPHIC: tripable (includes, M:N with Trip)
    public function trips(): MorphToMany
    {
        return $this->morphToMany(Trip::class, 'tripable', 'tripables')->withTimestamps();
    }
}
