<?php

namespace App\Interfaces\Catalog;

use App\Models\Catalog\Attraction;
use Illuminate\Database\Eloquent\Collection;

interface AttractionRepositoryInterface
{
    public function getForAdmin(bool $trashed = false): Collection;

    public function getForPublic(): Collection;

    public function findById($id, array $relations = []): Attraction;

    public function create(array $data): Attraction;

    public function update(Attraction $attraction, array $data): Attraction;

    public function delete(Attraction $attraction): bool;
}
