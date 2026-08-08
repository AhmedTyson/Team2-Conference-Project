<?php

namespace App\Services;

use App\Models\Trip;
use App\Notifications\TripForkedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TripForkService
{
    /**
     * Deep clones a trip plan for a user, marking lineage to the original source.
     */
    public function fulfillFork(int $userId, int $sourceTripId): Trip
    {
        $sourceTrip = Trip::with(['tripDestinations', 'hotels', 'attractions', 'restaurants'])->findOrFail($sourceTripId);

        return DB::transaction(function () use ($sourceTrip, $userId) {
            // Determine the root original_trip_id to maintain a single tree origin
            $originalTripId = $sourceTrip->original_trip_id ?? $sourceTrip->id;

            // 1) Copy the trip's basic info, injecting the new lineage columns
            $trip = Trip::create([
                'user_id' => $userId,
                'title' => $sourceTrip->title.' (Forked)',
                'travel_style' => $sourceTrip->travel_style,
                'interests' => $sourceTrip->interests,
                'no_of_travelers' => $sourceTrip->no_of_travelers,
                'budget' => $sourceTrip->budget,
                'no_of_days' => $sourceTrip->no_of_days,
                'start_date' => $sourceTrip->start_date,
                'end_date' => $sourceTrip->end_date,
                'estimated_cost' => $sourceTrip->estimated_cost,
                'status' => 'pending',
                'parent_trip_id' => $sourceTrip->id,
                'original_trip_id' => $originalTripId,
                'is_fork' => true,
                'source_version_id' => $sourceTrip->updated_at->toDateTimeString(), // using timestamp as simple versioning fallback
            ]);

            // 2) Copy tripDestinations (the "days")
            foreach ($sourceTrip->tripDestinations as $destination) {
                $trip->tripDestinations()->create([
                    'destination_id' => $destination->destination_id,
                    'day_number' => $destination->day_number,
                    'visit_order' => $destination->visit_order,
                    'estimated_date' => $destination->estimated_date,
                    'notes' => $destination->notes,
                ]);
            }

            // 3) Copy polymorphic trip_items (hotels, attractions, restaurants)
            if ($sourceTrip->hotels->isNotEmpty()) {
                $trip->hotels()->attach($sourceTrip->hotels->pluck('id'));
            }
            if ($sourceTrip->attractions->isNotEmpty()) {
                $trip->attractions()->attach($sourceTrip->attractions->pluck('id'));
            }
            if ($sourceTrip->restaurants->isNotEmpty()) {
                $trip->restaurants()->attach($sourceTrip->restaurants->pluck('id'));
            }

            Log::info("Trip {$sourceTrip->id} was forked by user {$userId} into new trip {$trip->id}");

            // Notify original owner
            if ($sourceTrip->user) {
                $sourceTrip->user->notify(new TripForkedNotification($trip, $sourceTrip));
            }

            return $trip;
        });
    }
}
