<?php

namespace App\Repositories\Catalog;

use App\Interfaces\Catalog\RestaurantRepositoryInterface;
use App\Models\Catalog\Restaurant;
use Illuminate\Database\Eloquent\Collection;

class RestaurantRepository implements RestaurantRepositoryInterface
{
    public function getForAdmin(bool $trashed = false): Collection
    {
        return Restaurant::query()->when($trashed, fn ($q) => $q->onlyTrashed())->get();
    }

    public function getForPublic()
    {
        $perPage = min((int) request('per_page', 20) ?: 20, 100);
        $query = Restaurant::with(['destination', 'category']);
        if (request()->has('page') || request()->has('per_page')) {
            return $query->paginate($perPage);
        }

        return $query->get();
    }

    public function findById($id, array $relations = []): Restaurant
    {
        $query = Restaurant::query();
        if (! empty($relations)) {
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
