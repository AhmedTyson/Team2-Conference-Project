<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement([
                'Beaches', 'Museums', 'Historical Sites', 'Nightlife', 'Nature & Parks',
                'Shopping', 'Fine Dining', 'Street Food', 'Adventure', 'Family Friendly',
            ]),
            'type' => fake()->randomElement(['destination', 'attraction', 'restaurant']),
        ];
    }
}
