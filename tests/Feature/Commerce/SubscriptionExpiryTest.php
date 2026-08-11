<?php

namespace Tests\Feature\Commerce;

use App\Console\Commands\ExpireStaleSubscriptions;
use App\Enums\SubscriptionStatus;
use App\Models\Account\User;
use App\Models\Commerce\Plan;
use App\Models\Commerce\Subscription;
use App\Services\Trips\AiUsageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionExpiryTest extends TestCase
{
    use RefreshDatabase;

    private function userWithActiveSubscription(int $quota = 5): User
    {
        $user = User::factory()->create(['is_active' => true]);
        $plan = Plan::factory()->create(['ai_quota_monthly' => $quota]);
        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'renews_at' => now()->addDay(),
            'started_at' => now(),
        ]);

        $user->forceFill([
            'ai_generations_count' => 0,
            'ai_reset_at' => now()->addMonth(),
        ])->save();

        return $user;
    }

    /*
    |--------------------------------------------------------------------------
    | R14 — Subscription expires at renews_at (per D2 — fixed-term quota pack)
    |--------------------------------------------------------------------------
    */

    public function test_r14_active_subscription_before_renews_at_remains_active(): void
    {
        $user = $this->userWithActiveSubscription();

        // Scheduler runs but subscription renews_at is in the future.
        $this->artisan('subscriptions:expire-stale')->assertExitCode(0);

        $this->assertEquals(SubscriptionStatus::ACTIVE, $user->subscriptions()->first()->status);
    }

    public function test_r14_subscription_expires_after_renews_at_passes(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $plan = Plan::factory()->create(['ai_quota_monthly' => 5]);

        $sub = Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'renews_at' => now()->subMinute(),
            'started_at' => now()->subDay(),
        ]);

        $this->artisan('subscriptions:expire-stale')->assertExitCode(0);

        $this->assertEquals(SubscriptionStatus::EXPIRED, $sub->fresh()->status);
    }

    public function test_r14_expired_subscription_blocks_quota_consumption(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $plan = Plan::factory()->create(['ai_quota_monthly' => 5]);

        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'renews_at' => now()->subMinute(),
            'started_at' => now()->subDay(),
        ]);

        // Expire the subscription.
        $this->artisan('subscriptions:expire-stale')->assertExitCode(0);

        // Quota consumption must now be rejected.
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('subscription');

        app(AiUsageService::class)->consumeQuota($user);
    }

    public function test_r14_repurchase_creates_fresh_subscription(): void
    {
        $user = User::factory()->create(['is_active' => true]);

        $plan = Plan::factory()->create(['ai_quota_monthly' => 5, 'price_cents' => 5000, 'currency' => 'EGP']);

        // First subscription, then expire it.
        $old = Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'renews_at' => now()->subMinute(),
            'started_at' => now()->subDay(),
        ]);
        $this->artisan('subscriptions:expire-stale')->assertExitCode(0);

        $this->assertEquals(SubscriptionStatus::EXPIRED, $old->fresh()->status);

        // Second active subscription (re-purchase).
        $new = Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'price_cents' => $plan->price_cents,
            'currency' => $plan->currency,
            'started_at' => now(),
            'renews_at' => now()->addMonth(),
            'provider' => 'paymob',
            'provider_ref' => 'ORDER_'.$user->id.'_rebuy_'.time(),
        ]);

        $this->assertEquals(SubscriptionStatus::ACTIVE, $new->status);
        $this->assertNotNull($new->renews_at);
        $this->assertGreaterThan(now(), $new->renews_at);

        // New subscription must allow quota consumption.
        app(AiUsageService::class)->consumeQuota($user);

        $this->assertEquals(1, $user->fresh()->ai_generations_count);
    }
}
