<?php

namespace App\Models;

use App\Enums\TripStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Trip extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'title', 'travel_style', 'interests', 'no_of_travelers',
        'budget', 'no_of_days', 'start_date', 'end_date', 'status',
        'estimated_cost', 'parent_trip_id', 'original_trip_id', 'is_fork',
        'source_version_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => TripStatus::class,
            'interests' => 'array',
            'start_date' => 'date',
            'end_date' => 'date',
            'is_fork' => 'boolean',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Trip::class, 'parent_trip_id');
    }

    public function original(): BelongsTo
    {
        return $this->belongsTo(Trip::class, 'original_trip_id');
    }

    public function forks(): HasMany
    {
        return $this->hasMany(Trip::class, 'parent_trip_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tripDestinations(): HasMany
    {
        return $this->hasMany(TripDestination::class);
    }

    public function destinations(): BelongsToMany
    {
        return $this->belongsToMany(Destination::class, 'trip_destinations')
            ->withPivot(['day_number', 'visit_order', 'estimated_date', 'notes'])
            ->withTimestamps();
    }

    public function flights(): MorphToMany
    {
        return $this->morphedByMany(Flight::class, 'item', 'trip_items')->withTimestamps();
    }

    public function itineraryItems(): HasMany
    {
        return $this->hasMany(ItineraryItem::class);
    }

    public function aiRecommendations(): HasMany
    {
        return $this->hasMany(AiRecommendation::class);
    }

    public function hotels(): MorphToMany
    {
        return $this->morphedByMany(Hotel::class, 'item', 'trip_items')->withTimestamps();
    }

    public function attractions(): MorphToMany
    {
        return $this->morphedByMany(Attraction::class, 'item', 'trip_items')->withTimestamps();
    }

    public function restaurants(): MorphToMany
    {
        return $this->morphedByMany(Restaurant::class, 'item', 'trip_items')->withTimestamps();
    }
}
