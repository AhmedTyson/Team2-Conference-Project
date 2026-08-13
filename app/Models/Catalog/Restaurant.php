<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Restaurant extends Model
{
    use HasFactory, SoftDeletes;

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
