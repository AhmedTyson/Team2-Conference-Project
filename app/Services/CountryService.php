<?php

namespace App\Services;

use App\Interfaces\CountryRepositoryInterface;

class CountryService
{
    protected $countryRepository;

    public function __construct(CountryRepositoryInterface $countryRepository)
    {
        $this->countryRepository = $countryRepository;
    }

    public function getAllCountries()
    {
        return $this->countryRepository->getAllCountries();
    }

    public function createCountry(array $data)
    {
        return $this->countryRepository->createCountry($data);
    }

    public function updateCountry(int $id, array $data)
    {
        return $this->countryRepository->updateCountry($id, $data);
    }

    public function deleteCountry(int $id)
    {
        return $this->countryRepository->deleteCountry($id);
    }
}