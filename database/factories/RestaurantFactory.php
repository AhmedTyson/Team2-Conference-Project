<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Destination;
use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Restaurant>
 */
class RestaurantFactory extends Factory
{
    protected $model = Restaurant::class;

    public function definition(): array
    {
        return [
            'destination_id' => Destination::factory(),
            'category_id' => Category::factory(),
            'name' => fake()->company().' Restaurant',
            'cuisine' => fake()->randomElement(['Italian', 'Japanese', 'Mexican', 'Indian', 'French', 'Egyptian']),
            'price_range' => fake()->randomElement(['low', 'medium', 'high']),
            'rating' => fake()->randomFloat(1, 1, 5),
            'address' => fake()->address(),
            'image' => 'img/'.fake()->randomElement(['restaurant.jpg', 'Paris.jpg', 'Safari.jpg']),
        ];
    }
}
