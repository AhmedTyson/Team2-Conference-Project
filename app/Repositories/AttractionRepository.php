<?php

namespace App\Repositories;

use App\Models\Attraction;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class AttractionRepository
{
    public function getForAdmin(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = Attraction::query();

        if (isset($filters['destination_id'])) {
            $query->where('destination_id', $filters['destination_id']);
        }

        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        return $query->paginate($perPage);
    }

    public function getForPublic(): Collection
    {
        return Attraction::with(['destination', 'category'])->get();
    }

    public function findById($id, array $relations = []): Attraction
    {
        $query = Attraction::query();

        if (!empty($relations)) {
            $query->with($relations);
        }

        return $query->findOrFail($id);
    }

    public function create(array $data): Attraction
    {
        return Attraction::create($data);
    }

    public function update(Attraction $attraction, array $data): Attraction
    {
        $attraction->update($data);
        return $attraction;
    }

    public function delete(Attraction $attraction): bool
    {
        $attraction->delete();
        return true;
    }
}
