<?php

namespace App\Services\Catalog;

use App\Interfaces\Catalog\DestinationRepositoryInterface;
use App\Models\Catalog\Destination;
use App\Models\Trips\Trip;
use RuntimeException;

class DestinationService
{
    protected $destinationRepository;

    public function __construct(DestinationRepositoryInterface $destinationRepository)
    {
        $this->destinationRepository = $destinationRepository;
    }

    public function index(array $filters = [])
    {
        return $this->destinationRepository->getAll($filters);
    }

    public function show($id)
    {
        return $this->destinationRepository->getById($id);
    }

    public function detail($id)
    {
        $destination = $this->destinationRepository->getDetail($id);

        $destination->setAttribute(
            'user_count',
            $this->destinationRepository->countDistinctTripUsers($destination->id)
        );

        return $destination;
    }

    public function bookableTripFor(Destination $destination): Trip
    {
        $trip = $destination->trips()->orderByDesc('trips.id')->first();

        if (! $trip) {
            throw new RuntimeException('No tour is currently available for this destination.');
        }

        return $trip;
    }
}
