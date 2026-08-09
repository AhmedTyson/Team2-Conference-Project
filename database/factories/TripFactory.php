<?php

namespace Database\Factories;

use App\Enums\TripStatus;
use App\Models\Account\User;
use App\Models\Trip;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Trip>
 */
class TripFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = fake()->dateTimeBetween('+1 week', '+3 months');
        $days = fake()->numberBetween(3, 14);
        $endDate = (clone $startDate)->modify("+{$days} days");

        return [
            'user_id' => User::factory(),
            'title' => fake()->words(3, true).' Trip',
            'travel_style' => fake()->randomElement(['relaxation', 'adventure', 'cultural', 'business', 'family']),
            'no_of_travelers' => fake()->numberBetween(1, 6),
            'interests' => fake()->randomElements(
                ['museums', 'food', 'nature', 'nightlife', 'shopping', 'history', 'beaches'],
                fake()->numberBetween(1, 3)
            ),
            'budget' => fake()->numberBetween(500, 10000),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'no_of_days' => $days,
            'status' => TripStatus::PENDING->value,
            'estimated_cost' => fake()->numberBetween(400, 9500),
        ];
    }
}
