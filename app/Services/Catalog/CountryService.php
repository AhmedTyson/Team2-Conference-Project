<?php

namespace App\Services\Catalog;

use App\Interfaces\Catalog\CountryRepositoryInterface;
use App\Repositories\Catalog\CountryRepository;

class CountryService
{
    protected $countryRepository;

    public function __construct(CountryRepositoryInterface $countryRepository)
    {
        $this->countryRepository = $countryRepository;
    }

    public function getAdminList()
    {
        return $this->countryRepository->getForAdmin();
    }

    public function showAdmin($id)
    {
        return $this->countryRepository->findById($id);
    }

    public function store(array $data)
    {
        return $this->countryRepository->create($data);
    }

    public function update($id, array $data)
    {
        $country = $this->countryRepository->findById($id);
        return $this->countryRepository->update($country, $data);
    }

    public function destroy($id)
    {
        $country = $this->countryRepository->findById($id);
        return $this->countryRepository->delete($country);
    }
}
