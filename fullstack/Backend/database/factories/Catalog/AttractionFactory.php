<?php

namespace Database\Factories\Catalog;

use App\Models\Catalog\Attraction;
use App\Models\Catalog\Category;
use App\Models\Catalog\Destination;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Attraction>
 */
class AttractionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'destination_id' => Destination::factory(),
            'category_id' => Category::factory(),
            'name' => fake()->words(3, true),
            'description' => fake()->paragraph(),
            'image' => 'img/'.fake()->randomElement(['destination.jpg', 'Paris.jpg', 'Safari.jpg']),
            'latitude' => fake()->latitude(29.8, 30.2),
            'longitude' => fake()->longitude(31.0, 31.4),
        ];
    }
}
