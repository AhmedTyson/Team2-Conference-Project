<?php

namespace App\Repositories\Catalog;

use App\Interfaces\Catalog\DestinationRepositoryInterface;
use App\Models\Catalog\Destination;

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
