<?php

namespace App\Repositories;

use App\Models\Trip;
use Illuminate\Pagination\LengthAwarePaginator;

class TripRepository
{
    public function getForAdmin(int $perPage): LengthAwarePaginator
    {
        return Trip::with(['user', 'destinations'])->latest()->paginate($perPage);
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
