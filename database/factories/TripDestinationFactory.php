<?php

namespace Database\Factories;

use App\Models\Catalog\Destination;
use App\Models\Trip;
use App\Models\TripDestination;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TripDestination>
 */
class TripDestinationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'trip_id' => Trip::factory(),
            'destination_id' => Destination::factory(),
            'day_number' => fake()->numberBetween(1, 10),
            'visit_order' => fake()->numberBetween(1, 5),
            'estimated_date' => fake()->dateTimeBetween('+1 week', '+3 months'),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
