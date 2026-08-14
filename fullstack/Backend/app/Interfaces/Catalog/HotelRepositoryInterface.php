<?php

namespace App\Interfaces\Catalog;

use Illuminate\Database\Eloquent\Collection;

interface HotelRepositoryInterface
{
    public function getAll();

    public function getById($id);

    public function countAll(): int;

    public function getByDestination(int $destinationId): Collection;

    public function create(array $data);

    public function update($id, array $data);

    public function delete($id);
}
