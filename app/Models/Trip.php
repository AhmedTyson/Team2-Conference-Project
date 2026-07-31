<?php

namespace App\Models;

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
        'budget', 'no_of_days', 'start_date', 'end_date', 'status', 'estimate_cost',
    ];

    protected function casts(): array
    {
        return [
            'interests' => 'array',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // M:N - visits, via trip_destinations (with extra pivot columns -> handled through TripDestination model)
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

    // 1:M - includes Flight
    public function flights(): HasMany
    {
        return $this->hasMany(Flight::class);
    }

    // 1:M - contains ItineraryItem
    public function itineraryItems(): HasMany
    {
        return $this->hasMany(ItineraryItem::class);
    }

    // 1:M - generates AiRecommendation
    public function aiRecommendations(): HasMany
    {
        return $this->hasMany(AiRecommendation::class);
    }

    // POLYMORPHIC: tripable (includes) -> Hotel / Attraction / Restaurant, unified M:N
    public function hotels(): MorphToMany
    {
        return $this->morphedByMany(Hotel::class, 'tripable', 'tripables')->withTimestamps();
    }

    public function attractions(): MorphToMany
    {
        return $this->morphedByMany(Attraction::class, 'tripable', 'tripables')->withTimestamps();
    }

    public function restaurants(): MorphToMany
    {
        return $this->morphedByMany(Restaurant::class, 'tripable', 'tripables')->withTimestamps();
    }
}
