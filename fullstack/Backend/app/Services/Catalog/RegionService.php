<?php

namespace App\Services\Catalog;

use App\Interfaces\Catalog\RegionRepositoryInterface;

class RegionService
{
    protected $regionRepository;

    public function __construct(RegionRepositoryInterface $regionRepository)
    {
        $this->regionRepository = $regionRepository;
    }

    public function index()
    {
        return $this->regionRepository->getAll();
    }
}
