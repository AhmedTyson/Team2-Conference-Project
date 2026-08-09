<?php

namespace App\Services;

use App\Models\Trip;
use App\Interfaces\TripRepositoryInterface;
use App\Repositories\TripRepository;
use App\Repositories\DestinationRepository;

class TripService
{
    protected $tripRepository;
    protected $destinationRepository;

    public function __construct(TripRepositoryInterface $tripRepository, DestinationRepository $destinationRepository)
    {
        $this->tripRepository = $tripRepository;
        $this->destinationRepository = $destinationRepository;
    }

    public function getAdminList()
    {
        return $this->tripRepository->getForAdmin();
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
