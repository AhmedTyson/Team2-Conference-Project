<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FlightSeeder extends Seeder
{
    public function run()
    {
        $path = database_path('seeders/fixtures/flights.json');

        // Mock fallback if running without database path
        if (! function_exists('database_path')) {
            $path = __DIR__.'/../fixtures/flights.json';
        }

        if (! file_exists($path)) {
            echo "Fixture not found: {$path}\n";

            return;
        }

        $flights = json_decode(file_get_contents($path), true);
        $insertData = [];

        $airlines = ['Emirates', 'Qatar Airways', 'EgyptAir', 'Air France', 'British Airways', 'Lufthansa', 'Etihad Airways', 'Turkish Airlines'];
        foreach ($flights as $index => $flight) {
            $airline = $flight['airline'] ?? $airlines[$index % count($airlines)];
            $flightNum = $flight['flight_number'] ?? (strtoupper(substr($airline, 0, 2)).'-'.(100 + ($index % 900)));
            $insertData[] = [
                'airline' => $airline,
                'flight_number' => $flightNum,
                'departure_airport' => $flight['departure_airport'],
                'arrival_airport' => $flight['arrival_airport'],
                'departure_date' => $flight['departure_date'],
                'arrival_date' => $flight['arrival_date'],
                'price' => $flight['price'],
                'booking_status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('flights')->insert($insertData);
    }
}
