<?php

namespace App\Repositories;

use App\Models\Restaurant;
use Illuminate\Pagination\LengthAwarePaginator;

class RestaurantRepository
{
    public function getForAdmin(int $perPage): LengthAwarePaginator
    {
        return Restaurant::paginate($perPage);
    }

    public function getForPublic(int $perPage = 10): LengthAwarePaginator
    {
        return Restaurant::with(['destination', 'category'])->paginate($perPage);
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
