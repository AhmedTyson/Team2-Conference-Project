<?php

namespace Database\Factories;

use App\Models\AiRecommendation;
use App\Models\Trip;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AiRecommendation>
 */
class AiRecommendationFactory extends Factory
{
    protected $model = AiRecommendation::class;

    public function definition(): array
    {
        return [
            'trip_id' => Trip::factory(),
            'prompt_text' => fake()->sentence(8),
            'response_text' => fake()->paragraph(),
            'generated_at' => now()->toDateTimeString(),
            'model_used' => fake()->randomElement(['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']),
            'tokens_used' => (string) fake()->numberBetween(100, 4000),
        ];
    }
}
