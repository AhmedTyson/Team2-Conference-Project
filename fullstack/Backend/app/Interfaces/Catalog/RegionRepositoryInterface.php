<?php

namespace App\Interfaces\Catalog;

use App\Models\Catalog\Region;
use Illuminate\Database\Eloquent\Collection;

interface RegionRepositoryInterface
{
    public function getAll(): Collection;

    public function findByKey(string $key): ?Region;
}
