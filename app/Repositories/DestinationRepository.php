<?php

namespace App\Repositories;

use App\Interfaces\DestinationRepositoryInterface;
use App\Models\Destination;

class DestinationRepository implements DestinationRepositoryInterface
{
    public function getAll()
    {
        return Destination::with('country')->get();
    }

    public function getById($id)
    {
        return Destination::with('country')->findOrFail($id);
    }

    public function getForTripCreation()
    {
        return Destination::query()
            ->select('id', 'name', 'city_name', 'image')
            ->orderBy('name')
            ->get();
    }
}
