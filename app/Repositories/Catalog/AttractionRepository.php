<?php

namespace App\Repositories\Catalog;

use App\Interfaces\Catalog\AttractionRepositoryInterface;
use App\Models\Catalog\Attraction;
use Illuminate\Database\Eloquent\Collection;

class AttractionRepository implements AttractionRepositoryInterface
{
    public function getForAdmin(): Collection
    {
        return Attraction::all();
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
