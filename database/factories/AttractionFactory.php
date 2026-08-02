<?php

namespace Database\Factories;

use App\Models\Attraction;
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
            'name' =>fake()->words(3, true),
            'description' => fake()->paragraph(),
            // 'image' => 
            'latitude' => fake()->latitude(),
            'longitude' => fake()->longitude(),
        ];
    }
}
