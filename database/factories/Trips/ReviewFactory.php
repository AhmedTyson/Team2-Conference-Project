<?php

namespace Database\Factories\Trips;

use App\Models\Account\User;
use App\Models\Trips\Review;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    protected $model = Review::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'reviewable_id' => null,
            'reviewable_type' => null,
            'rating' => fake()->numberBetween(1, 5),
            'comment' => fake()->paragraph(),
            'status' => fake()->randomElement(['pending', 'approved', 'rejected']),
        ];
    }
}
