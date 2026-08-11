<?php

namespace App\Policies;

use App\Models\Account\User;
use App\Models\Trips\Trip;

class TripPolicy
{
    /**
     * A user may only access trips they own.
     *
     * Phase 4 (D1) may extend this to public/shared trips via an is_public flag.
     */
    public function view(User $user, Trip $trip): bool
    {
        return $trip->user_id === $user->id;
    }

    /**
     * SEC-04 (D1 — Option B): fork is allowed iff the trip is public OR the buyer owns it.
     * Private trips remain owner-only even after payment is initiated.
     */
    public function fork(User $user, Trip $trip): bool
    {
        return $trip->is_public || $trip->user_id === $user->id;
    }
}
