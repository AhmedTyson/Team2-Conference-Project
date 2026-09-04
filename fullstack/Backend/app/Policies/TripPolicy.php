<?php

namespace App\Policies;

use App\Models\Account\User;
use App\Models\Trips\Trip;

class TripPolicy
{
    /**
     * Determine whether the user can view the trip.
     *
     * Guests may view public trips (community hub). Owners may view
     * their own trips regardless of visibility. Callers map denial
     * to 404 (not 403) to avoid leaking whether the trip exists.
     */
    public function view(?User $user, Trip $trip): bool
    {
        return $trip->is_public || ($user && $user->id === $trip->user_id);
    }

    /**
     * Determine whether the user can fork the trip.
     *
     * Forking is only allowed for public trips or the owner's own trip.
     */
    public function fork(User $user, Trip $trip): bool
    {
        return $trip->is_public || $trip->user_id === $user->id;
    }
}
