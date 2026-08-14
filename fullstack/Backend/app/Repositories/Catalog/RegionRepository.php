<?php

namespace App\Repositories\Catalog;

use App\Interfaces\Catalog\RegionRepositoryInterface;
use App\Models\Catalog\Region;
use Illuminate\Database\Eloquent\Collection;

class RegionRepository implements RegionRepositoryInterface
{
    public function getAll(): Collection
    {
        return Region::orderBy('id')->get();
    }

    public function findByKey(string $key): ?Region
    {
        return Region::where('key', $key)->first();
    }
}
