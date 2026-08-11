<?php

namespace App\Repositories\Catalog;

use App\Interfaces\Catalog\CountryRepositoryInterface;
use App\Models\Catalog\Country;
use Illuminate\Database\Eloquent\Collection;

class CountryRepository implements CountryRepositoryInterface
{
    public function getForAdmin(bool $trashed = false): Collection
    {
        return Country::query()->when($trashed, fn ($q) => $q->onlyTrashed())->get();
    }

    public function findById($id): Country
    {
        return Country::findOrFail($id);
    }

    public function create(array $data): Country
    {
        return Country::create($data);
    }

    public function update(Country $country, array $data): Country
    {
        $country->update($data);
        return $country;
    }

    public function delete(Country $country): bool
    {
        $country->delete();
        return true;
    }
}
