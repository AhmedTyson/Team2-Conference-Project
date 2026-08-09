<?php

namespace App\Interfaces\Catalog;

use App\Models\Catalog\Flight;
use Illuminate\Database\Eloquent\Collection;

interface FlightRepositoryInterface
{
    public function getForAdmin(): Collection;

    public function getForPublic(): Collection;

    public function findById($id): Flight;

    public function create(array $data): Flight;

    public function update(Flight $flight, array $data): Flight;

    public function delete(Flight $flight): bool;

}
