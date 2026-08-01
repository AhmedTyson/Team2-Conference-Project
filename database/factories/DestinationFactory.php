<?php

namespace Database\Factories;

use App\Models\Destination;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Destination>
 */
class DestinationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' =>fake()->city(),
            'city_name' => fake()->city(),
            'description' => fake()->paragraph(),
            // 'image' => fake()->
            'latitude' => fake()->latitude(),
            'longitude' => fake()->longitude(),
        ];
    }
}
