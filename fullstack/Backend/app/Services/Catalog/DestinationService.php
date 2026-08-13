<?php

namespace App\Services\Catalog;

use App\Interfaces\Catalog\DestinationRepositoryInterface;

class DestinationService
{
    protected $destinationRepository;

    public function __construct(DestinationRepositoryInterface $destinationRepository)
    {
        $this->destinationRepository = $destinationRepository;
    }

    public function index()
    {
        return $this->destinationRepository->getAll();
    }

    public function show($id)
    {
        return $this->destinationRepository->getById($id);
    }
}
