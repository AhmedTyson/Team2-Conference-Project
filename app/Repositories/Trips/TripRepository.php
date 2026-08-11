<?php

namespace App\Repositories\Trips;

use App\Interfaces\Trips\TripRepositoryInterface;
use App\Models\Trips\Trip;
use Illuminate\Database\Eloquent\Collection;

class TripRepository implements TripRepositoryInterface
{
    public function getForAdmin(bool $trashed = false): Collection
    {
        return Trip::with(['user', 'destinations'])
            ->when($trashed, fn ($q) => $q->onlyTrashed())
            ->latest()
            ->get();
    }

    public function findById($id): Trip
    {
        return Trip::findOrFail($id);
    }

    public function create(array $data): Trip
    {
        return Trip::create($data);
    }

    public function update(Trip $trip, array $data): Trip
    {
        $trip->update($data);
        return $trip;
    }

    public function delete(Trip $trip): bool
    {
        $trip->delete();
        return true;
    }
}
