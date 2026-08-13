<?php

namespace Database\Factories\System;

use App\Enums\NotificationStatus;
use App\Models\Account\User;
use App\Models\System\Notification;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'type' => fake()->randomElement(['info', 'alert', 'trip', 'system']),
            'body' => fake()->paragraph(),
            'data' => ['ref' => fake()->uuid()],
            'status' => NotificationStatus::UNREAD->value,
        ];
    }
}
