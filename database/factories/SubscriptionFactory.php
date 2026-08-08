<?php

namespace Database\Factories;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
{
    public function definition(): array
    {
        $plan = Plan::factory()->create();

        return [
            'user_id' => User::factory(),
            'plan_id' => $plan->id,
            'status' => 'active',
            'price_cents' => $plan->price_cents,
            'currency' => $plan->currency,
            'started_at' => now(),
            'renews_at' => now()->addMonth(),
            'provider' => null,
            'provider_ref' => null,
        ];
    }
}
