<?php

namespace Database\Factories\System;

use App\Models\Account\User;
use App\Models\System\Survey;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Survey>
 */
class SurveyFactory extends Factory
{
    protected $model = Survey::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'travel_style' => fake()->randomElement(['Adventure', 'Relaxation', 'Cultural', 'Family', 'Luxury', 'Backpacking']),
            'budget_level' => fake()->randomElement(['low', 'medium', 'high', 'luxury']),
            'interests' => fake()->randomElements(['Beaches', 'Museums', 'Hiking', 'Nightlife', 'Food', 'Shopping', 'History'],
                fake()->numberBetween(2, 4)),
        ];
    }
}
