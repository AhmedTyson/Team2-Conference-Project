<?php

namespace App\Services\Catalog;

use App\Interfaces\Catalog\FlightRepositoryInterface;
use App\Interfaces\Catalog\HotelRepositoryInterface;
use App\Interfaces\Trips\ReviewRepositoryInterface;
use App\Interfaces\Trips\TripRepositoryInterface;

class StatsService
{
    protected $hotelRepository;

    protected $tripRepository;

    protected $flightRepository;

    protected $reviewRepository;

    public function __construct(
        HotelRepositoryInterface $hotelRepository,
        TripRepositoryInterface $tripRepository,
        FlightRepositoryInterface $flightRepository,
        ReviewRepositoryInterface $reviewRepository
    ) {
        $this->hotelRepository = $hotelRepository;
        $this->tripRepository = $tripRepository;
        $this->flightRepository = $flightRepository;
        $this->reviewRepository = $reviewRepository;
    }

    public function summary(): array
    {
        $approvedReviews = $this->reviewRepository->countApproved();

        return [
            'hotels' => $this->hotelRepository->countAll(),
            'tours' => $this->tripRepository->countAll(),
            'flights' => $this->flightRepository->countAll(),
            'reviews' => $approvedReviews >= 1000
                ? round($approvedReviews / 1000, 1) . 'K'
                : (string) $approvedReviews,
        ];
    }
}
