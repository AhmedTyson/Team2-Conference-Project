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
        protected array $realCities = [
        ['lat' => 48.8566, 'lng' => 2.3522],    // Paris
        ['lat' => 40.7128, 'lng' => -74.0060],  // New York
        ['lat' => 51.5074, 'lng' => -0.1278],   // London
        ['lat' => 25.2048, 'lng' => 55.2708],   // Dubai
        ['lat' => 35.6762, 'lng' => 139.6503],  // Tokyo
        ['lat' => -33.8688, 'lng' => 151.2093], // Sydney
        ['lat' => 41.9028, 'lng' => 12.4964],   // Rome
        ['lat' => 30.0444, 'lng' => 31.2357],   // Cairo
    ];
        public function definition(): array
    {
        $city = fake()->randomElement($this->realCities);
        return [
            'country_id' => Country::inRandomOrder()->first()?->id ?? Country::factory(),
            'name' =>fake()->city(),
            'city_name' => fake()->city(),
            'description' => fake()->paragraph(),
            'image' => 'img/' . fake()->randomElement(['destination.jpg', 'Paris.jpg', 'Safari.jpg']),
            // 'latitude' => fake()->latitude(),
            // 'longitude' => fake()->longitude(),
            'latitude' => $city['lat'],
            'longitude' => $city['lng'],
        ];
    }
}
