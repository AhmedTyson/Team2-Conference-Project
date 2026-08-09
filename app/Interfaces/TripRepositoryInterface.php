<?php

namespace App\Interfaces;

use App\Models\Trip;
use Illuminate\Database\Eloquent\Collection;

interface TripRepositoryInterface
{
    public function getForAdmin(): Collection;

    public function findById($id): Trip;

    public function create(array $data): Trip;

    public function update(Trip $trip, array $data): Trip;

    public function delete(Trip $trip): bool;

}
