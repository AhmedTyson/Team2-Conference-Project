<?php

namespace App\Services\Fixtures;

use Illuminate\Support\Facades\Log;
use App\Models\Destination;

class FlightFixtureService
{
    public function sync(?int $limit = null): array
    {
        // Mock flights logic mimicking RapidAPI Flights endpoint response structure
        // Loops through all destinations in database to construct realistic flights
        try {
            $destinations = Destination::all();
            if ($destinations->isEmpty()) {
                Log::warning("No destinations found in database. Cannot sync flights.");
                return [];
            }

            $allFlights = [];
            $counter = 0;

            foreach ($destinations as $destination) {
                if ($limit !== null && $counter >= $limit) {
                    break;
                }

                $allFlights[] = [
                    'departure_airport' => 'JFK',
                    'arrival_airport' => strtoupper(substr($destination->name, 0, 3)),
                    'departure_date' => now()->addDays(rand(10, 30))->format('Y-m-d H:i:s'),
                    'arrival_date' => now()->addDays(rand(10, 30))->addHours(8)->format('Y-m-d H:i:s'),
                    'price' => (float) rand(400, 1200)
                ];

                $counter++;
            }

            return $allFlights;
        } catch (\Exception $e) {
            Log::warning("FlightFixtureService failed: " . $e->getMessage());
            throw $e;
        }
    }
}
