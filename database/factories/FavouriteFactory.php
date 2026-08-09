<?php

namespace Database\Factories;

use App\Models\Account\User;
use App\Models\Favourite;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Favourite>
 */
class FavouriteFactory extends Factory
{
    protected $model = Favourite::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'favorable_id' => null,
            'favorable_type' => null,
            'note' => fake()->optional()->sentence(),
        ];
    }
}
