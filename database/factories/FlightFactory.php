<?php

namespace Database\Factories;

use App\Models\Flight;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Flight>
 */
class FlightFactory extends Factory
{
    protected $model = Flight::class;

    public function definition(): array
    {
        $departure = fake()->dateTimeBetween('+1 week', '+2 months');

        return [
            'airline' => fake()->randomElement(['EgyptAir', 'Emirates', 'Qatar Airways', 'Lufthansa', 'Turkish Airlines']),
            'flight_number' => strtoupper(fake()->lexify('??')) . fake()->numberBetween(100, 999),
            'departure_airport' => fake()->randomElement(['CAI', 'DXB', 'CDG', 'LHR', 'JFK']),
            'arrival_airport' => fake()->randomElement(['DXB', 'CDG', 'LHR', 'CAI', 'IST']),
            'departure_date' => $departure,
            'arrival_date' => (clone $departure)->modify('+' . fake()->numberBetween(3, 14) . ' hours'),
            'price' => fake()->randomFloat(2, 100, 1500),
            'booking_status' => fake()->randomElement(['pending', 'confirmed', 'cancelled']),
        ];
    }
}
