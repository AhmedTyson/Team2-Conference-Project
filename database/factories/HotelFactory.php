<?php

namespace Database\Factories;

use App\Models\Destination;
use App\Models\Hotel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Hotel>
 */
class HotelFactory extends Factory
{
    protected $model = Hotel::class;

    public function definition(): array
    {
        return [
            'destination_id' => Destination::factory(),
            'name' => fake()->company().' Hotel',
            'address' => fake()->address(),
            'price_per_night' => fake()->randomFloat(2, 30, 600),
            'rating' => fake()->randomFloat(1, 1, 5),
            'stars' => fake()->numberBetween(1, 5),
            'availability' => fake()->boolean(),
            'image' => 'img/'.fake()->randomElement(['hotel.jpg', 'Paris.jpg', 'Safari.jpg']),
        ];
    }
}
