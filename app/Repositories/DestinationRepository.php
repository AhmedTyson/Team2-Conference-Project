<?php

namespace App\Repositories;

use App\Models\Destination;

class DestinationRepository
{
    public function getAll()
    {
        return Destination::with('country')->get();
    }

    public function getById($id)
    {
        return Destination::with('country')->findOrFail($id);
    }
}