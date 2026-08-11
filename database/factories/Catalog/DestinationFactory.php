<?php

namespace Database\Factories\Catalog;

use App\Models\Catalog\Country;
use App\Models\Catalog\Destination;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Destination>
 */
class DestinationFactory extends Factory
{
    protected array $realCities = [
        ['lat' => 48.8566, 'lng' => 2.3522, 'city' => 'Paris'],
        ['lat' => 40.7128, 'lng' => -74.0060, 'city' => 'New York'],
        ['lat' => 51.5074, 'lng' => -0.1278, 'city' => 'London'],
        ['lat' => 25.2048, 'lng' => 55.2708, 'city' => 'Dubai'],
        ['lat' => 35.6762, 'lng' => 139.6503, 'city' => 'Tokyo'],
        ['lat' => -33.8688, 'lng' => 151.2093, 'city' => 'Sydney'],
        ['lat' => 41.9028, 'lng' => 12.4964, 'city' => 'Rome'],
        ['lat' => 30.0444, 'lng' => 31.2357, 'city' => 'Cairo'],
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $city = fake()->randomElement($this->realCities);

        return [
            'country_id' => Country::inRandomOrder()->first()?->id ?? Country::factory(),
            'name' => $city['city'],
            'city_name' => $city['city'],
            'description' => fake()->paragraph(),
            'image' => 'img/'.fake()->randomElement(['destination.jpg', 'Paris.jpg', 'Safari.jpg']),
            'latitude' => $city['lat'],
            'longitude' => $city['lng'],
        ];
    }
}
