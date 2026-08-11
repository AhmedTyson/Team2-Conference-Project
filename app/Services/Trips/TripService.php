<?php

namespace App\Services\Trips;

use App\Interfaces\Trips\TripRepositoryInterface;
use App\Repositories\Catalog\DestinationRepository;

class TripService
{
    protected $tripRepository;

    protected $destinationRepository;

    public function __construct(TripRepositoryInterface $tripRepository, DestinationRepository $destinationRepository)
    {
        $this->tripRepository = $tripRepository;
        $this->destinationRepository = $destinationRepository;
    }

    public function getAdminList(bool $trashed = false)
    {
        return $this->tripRepository->getForAdmin($trashed);
    }

    public function getCreationData()
    {
        return [
            'destinations' => $this->destinationRepository->getForTripCreation(),
            'travel_styles' => ['solo', 'couple', 'family', 'friends', 'business'],
            'budget_levels' => ['low', 'medium', 'high'],
        ];
    }

    public function store(array $data)
    {
        return $this->tripRepository->create($data);
    }

    public function show($id)
    {
        return $this->tripRepository->findById($id);
    }

    public function update($id, array $data)
    {
        $trip = $this->tripRepository->findById($id);

        return $this->tripRepository->update($trip, $data);
    }

    public function destroy($id)
    {
        $trip = $this->tripRepository->findById($id);

        return $this->tripRepository->delete($trip);
    }
}
