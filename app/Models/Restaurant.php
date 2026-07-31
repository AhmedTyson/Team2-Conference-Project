<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Restaurant extends Model
{
    use HasFactory;

    protected $fillable = [
        'destination_id', 'category_id', 'name', 'cuisine',
        'price_range', 'rating', 'address', 'image',
    ];

    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
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
