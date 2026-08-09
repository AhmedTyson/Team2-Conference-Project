<?php

namespace App\Repositories;

use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Collection;

class RestaurantRepository
{
    public function getForAdmin(): Collection
    {
        return Restaurant::all();
    }

    public function getForPublic(): Collection
    {
        return Restaurant::with(['destination', 'category'])->get();
    }

    public function findById($id, array $relations = []): Restaurant
    {
        $query = Restaurant::query();
        if (!empty($relations)) {
            $query->with($relations);
        }
        return $query->findOrFail($id);
    }

    public function create(array $data): Restaurant
    {
        return Restaurant::create($data);
    }

    public function update(Restaurant $restaurant, array $data): Restaurant
    {
        $restaurant->update($data);
        return $restaurant;
    }

    public function delete(Restaurant $restaurant): bool
    {
        $restaurant->delete();
        return true;
    }
}
