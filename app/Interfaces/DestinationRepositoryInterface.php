<?php

namespace App\Interfaces;

use App\Models\Destination;
use Illuminate\Database\Eloquent\Collection;

interface DestinationRepositoryInterface
{
    public function getAll();

    public function getById($id);

    public function getForTripCreation();

}
