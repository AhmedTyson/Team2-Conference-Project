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

    public function reviews(): MorphMany
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    public function itineraryItems(): MorphMany
    {
        return $this->morphMany(ItineraryItem::class, 'itemable');
    }

    public function trips(): MorphToMany
    {
        return $this->morphToMany(Trip::class, 'item', 'trip_items')->withTimestamps();
    }
    public function favourites(): MorphMany
    {
        return $this->morphMany(Favourite::class, 'favorable');
    }
}
