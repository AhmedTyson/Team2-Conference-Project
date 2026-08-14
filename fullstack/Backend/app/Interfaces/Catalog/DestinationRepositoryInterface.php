<?php

namespace App\Interfaces\Catalog;

use App\Models\Catalog\Destination;
use Illuminate\Database\Eloquent\Collection;

interface DestinationRepositoryInterface
{
    public function getAll(array $filters = []): Collection;

    public function getById($id): Destination;

    public function getDetail($id): Destination;

    public function countDistinctTripUsers(int $destinationId): int;

    public function getForTripCreation();
}
