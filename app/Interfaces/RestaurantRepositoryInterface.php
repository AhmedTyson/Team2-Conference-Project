<?php

namespace App\Interfaces;

use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Collection;

interface RestaurantRepositoryInterface
{
    public function getForAdmin(): Collection;

    public function getForPublic(): Collection;

    public function findById($id, array $relations = []): Restaurant;

    public function create(array $data): Restaurant;

    public function update(Restaurant $restaurant, array $data): Restaurant;

    public function delete(Restaurant $restaurant): bool;

}
