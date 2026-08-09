<?php

namespace App\Repositories;

use App\Interfaces\FlightRepositoryInterface;
use App\Models\Flight;
use Illuminate\Database\Eloquent\Collection;

class FlightRepository implements FlightRepositoryInterface
{
    public function getForAdmin(): Collection
    {
        return Flight::latest()->get();
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
