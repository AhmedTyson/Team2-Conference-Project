<?php

namespace App\Repositories\Catalog;

use App\Interfaces\Catalog\FlightRepositoryInterface;
use App\Models\Catalog\Flight;
use Illuminate\Database\Eloquent\Collection;

class FlightRepository implements FlightRepositoryInterface
{
    public function getForAdmin(bool $trashed = false): Collection
    {
        return Flight::query()->when($trashed, fn ($q) => $q->onlyTrashed())->latest()->get();
    }

    public function getForPublic(): Collection
    {
        return Flight::all();
    }

    public function findById($id): Flight
    {
        return Flight::findOrFail($id);
    }

    public function create(array $data): Flight
    {
        return Flight::create($data);
    }

    public function update(Flight $flight, array $data): Flight
    {
        $flight->update($data);
        return $flight;
    }

    public function delete(Flight $flight): bool
    {
        $flight->delete();
        return true;
    }
}
