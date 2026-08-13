<?php

namespace App\Interfaces\Catalog;

use App\Models\Catalog\Restaurant;
use Illuminate\Database\Eloquent\Collection;

interface RestaurantRepositoryInterface
{
    public function getForAdmin(bool $trashed = false): Collection;

    public function getForPublic(): Collection;

    public function findById($id, array $relations = []): Restaurant;

    public function create(array $data): Restaurant;

    public function update(Restaurant $restaurant, array $data): Restaurant;

    public function delete(Restaurant $restaurant): bool;
}
