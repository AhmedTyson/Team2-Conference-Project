<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Destination extends Model
{
    use HasFactory;

    protected $fillable = [
        'country_id',  'name', 'city_name', 'description',
        'image', 'latitude', 'longitude',
    ];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function hotels(): HasMany
    {
        return $this->hasMany(Hotel::class);
    }

    public function attractions(): HasMany
    {
        return $this->hasMany(Attraction::class);
    }

    public function restaurants(): HasMany
    {
        return $this->hasMany(Restaurant::class);
    }

    public function favourites(): MorphMany
    {
        return $this->morphMany(Favourite::class, 'favorable');
    }

    public function tripDestinations(): HasMany
    {
        return $this->hasMany(TripDestination::class);
    }

    public function trips(): BelongsToMany
    {
        return $this->belongsToMany(Trip::class, 'trip_destinations')
            ->withPivot(['day_number', 'visit_order', 'estimated_date', 'notes'])
            ->withTimestamps();
    }

    public function reviews(): MorphMany
    {
        return $this->morphMany(Review::class, 'reviewable');
    }
}
