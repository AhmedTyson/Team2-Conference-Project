<?php

namespace Database\Factories\System;

use App\Models\System\Setting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Setting>
 */
class SettingFactory extends Factory
{
    protected $model = Setting::class;

    public function definition(): array
    {
        return [
            'Setting_id' => Setting::factory(),
            'key' => fake()->unique()->slug(2, false),
            'value' => fake()->sentence(),
        ];
    }
}
