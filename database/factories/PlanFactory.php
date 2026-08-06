<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Plan>
 */
class PlanFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'price_cents' => fake()->randomElement([0, 19900, 49900, 99900]),
            'currency' => 'EGP',
            'billing_cycle' => fake()->randomElement(['monthly', 'yearly']),
            'ai_quota_monthly' => fake()->randomElement([0, 50, 200]),
            'features' => [fake()->word(), fake()->word()],
            'is_active' => true,
        ];
    }
}
