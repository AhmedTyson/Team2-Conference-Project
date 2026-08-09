<?php

namespace App\Interfaces;

use App\Models\Country;
use Illuminate\Database\Eloquent\Collection;

interface CountryRepositoryInterface
{
    public function getForAdmin(): Collection;

    public function findById($id): Country;

    public function create(array $data): Country;

    public function update(Country $country, array $data): Country;

    public function delete(Country $country): bool;

}
