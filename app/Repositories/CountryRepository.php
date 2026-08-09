<?php

namespace App\Repositories;

use App\Models\Country;
use Illuminate\Pagination\LengthAwarePaginator;

class CountryRepository
{
    public function getForAdmin(int $perPage): LengthAwarePaginator
    {
        return Country::paginate($perPage);
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
