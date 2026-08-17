<?php

namespace App\Policies;

use App\Models\Account\User;
use App\Models\Trips\Trip;

class TripPolicy
{
    /**
     * Determine whether the user can view the trip.
     *
     * Owner-only — callers map denial to 404 (not 403) to avoid leaking
     * whether the trip exists.
     */
    public function view(User $user, Trip $trip): bool
    {
        return $trip->is_public || $trip->user_id === $user->id;
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
