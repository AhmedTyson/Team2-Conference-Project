<?php

namespace Database\Factories;

use App\Models\Attraction;
use App\Models\Category;
use App\Models\Destination;
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
            'name' =>fake()->words(3, true),
            'description' => fake()->paragraph(),
            'image' => 'img/' . fake()->randomElement(['destination.jpg', 'Paris.jpg', 'Safari.jpg']),
            'latitude' => fake()->latitude(),
            'longitude' => fake()->longitude(),
        ];
    }
}
