<?php

namespace App\Interfaces;

interface CountryRepositoryInterface
{
    public function getAllCountries();

    public function createCountry(array $data);

    public function updateCountry(int $id, array $data);

    public function deleteCountry(int $id);
}