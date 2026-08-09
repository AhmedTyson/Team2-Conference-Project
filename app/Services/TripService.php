<?php

namespace App\Services;

use App\Models\Trip;
use App\Repositories\TripRepository;
use App\Repositories\DestinationRepository;

class TripService
{
    protected $tripRepository;
    protected $destinationRepository;

    public function __construct(TripRepository $tripRepository, DestinationRepository $destinationRepository)
    {
        $this->tripRepository = $tripRepository;
        $this->destinationRepository = $destinationRepository;
    }

    public function getAdminList(int $perPage)
    {
        return $this->tripRepository->getForAdmin($perPage);
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
