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
            'budget_level' => fake()->randomElement(['7000', '14000', '21000']),
            'interests' => fake()->randomElements(['Beaches', 'Museums', 'Hiking', 'Nightlife', 'Food', 'Shopping', 'History'],
                fake()->numberBetween(2, 4)),
        ];
    }
}
