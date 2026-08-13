<?php

namespace App\Policies;

use App\Models\Account\User;
use App\Models\Trips\Trip;

class TripPolicy
{
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
