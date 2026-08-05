<?php

namespace App\Repositories;

use App\Interfaces\CountryRepositoryInterface;
use App\Models\Country;

class CountryRepository implements CountryRepositoryInterface
{
    public function getAllCountries()
    {
        return Country::paginate(15);
    }

    public function createCountry(array $data)
    {
        return Country::create($data);
    }

    public function updateCountry(int $id, array $data)
    {
        $country = Country::findOrFail($id);

        $country->update($data);

        return $country;
    }

    public function deleteCountry(int $id)
    {
        $country = Country::findOrFail($id);

        $country->delete();
    }
}