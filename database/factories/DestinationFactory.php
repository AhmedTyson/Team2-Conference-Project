<?php

namespace Database\Factories;

use App\Models\Country;
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
            'country_id' => Country::inRandomOrder()->first()?->id ?? Country::factory(),
            'name' =>fake()->city(),
            'city_name' => fake()->city(),
            'description' => fake()->paragraph(),
            'image' => 'img/' . fake()->randomElement(['destination.jpg', 'Paris.jpg', 'Safari.jpg']),
            'latitude' => fake()->latitude(),
            'longitude' => fake()->longitude(),
        ];
    }
}
