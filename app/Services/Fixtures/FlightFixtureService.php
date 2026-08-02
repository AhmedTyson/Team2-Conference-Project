<?php

namespace App\Services\Fixtures;

use Illuminate\Support\Facades\Log;

class FlightFixtureService
{
    public function sync(int $limit = 20): array
    {
        // Mock flights logic mimicking RapidAPI Flights endpoint response structure
        // to maintain clean local seeding data structure.
        try {
            $flights = [
                [
                    'departure_airport' => 'JFK',
                    'arrival_airport' => 'CDG',
                    'departure_date' => now()->addDays(30)->format('Y-m-d 18:30:00'),
                    'arrival_date' => now()->addDays(31)->format('Y-m-d 07:45:00'),
                    'price' => 650.00
                ],
                [
                    'departure_airport' => 'LHR',
                    'arrival_airport' => 'HND',
                    'departure_date' => now()->addDays(45)->format('Y-m-d 12:00:00'),
                    'arrival_date' => now()->addDays(46)->format('Y-m-d 09:30:00'),
                    'price' => 1120.00
                ]
            ];

            return array_slice($flights, 0, $limit);
        } catch (\Exception $e) {
            Log::warning("FlightFixtureService failed: " . $e->getMessage());
            throw $e;
        }
    }
}
