<?php

namespace App\Services;

use App\Interfaces\DestinationRepositoryInterface;
use App\Repositories\DestinationRepository;

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
