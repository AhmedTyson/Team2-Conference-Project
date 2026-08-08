<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Attraction extends Model
{
    use HasFactory;

    protected $fillable = [
        'destination_id', 'category_id', 'name', 'description',
        'image', 'latitude', 'longitude',
    ];

    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
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
