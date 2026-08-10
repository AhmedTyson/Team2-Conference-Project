<?php

namespace App\Interfaces\Catalog;

use App\Models\Catalog\Destination;
use Illuminate\Database\Eloquent\Collection;

interface DestinationRepositoryInterface
{
    public function getAll();

    public function getById($id);

    public function getForTripCreation();

}
