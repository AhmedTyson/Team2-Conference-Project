<?php

namespace Tests\Feature\Commerce;

use App\Models\Account\User;
use App\Models\Commerce\Plan;
use App\Models\Commerce\Subscription;
use App\Services\Trips\AiUsageService;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AiQuotaIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'user', 'guard_name' => 'api']);
    }

    public function test_api_me_returns_real_ai_quota_subscription_data(): void
    {
        $user = User::factory()->create(['ai_generations_count' => 12]);
        $user->assignRole('user');

        $plan = Plan::create([
            'name' => 'Pro Plan',
            'slug' => 'pro-plan',
            'price_cents' => 2900,
            'currency' => 'USD',
            'ai_quota_monthly' => 500,
            'features' => ['AI Itineraries'],
        ]);

        Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'price_cents' => 2900,
            'renews_at' => now()->addMonth(),
        ]);

        $response = $this->actingAs($user, 'api')->getJson('/api/me');

        $response->assertStatus(200)
            ->assertJsonPath('data.user.subscription.plan_name', 'Pro Plan')
            ->assertJsonPath('data.user.subscription.ai_quota_total', 500)
            ->assertJsonPath('data.user.subscription.ai_quota_used', 12)
            ->assertJsonPath('data.user.subscription.ai_quota_remaining', 488);
    }

    public function test_api_me_ai_quota_endpoint_returns_dedicated_quota_and_expiration(): void
    {
        $user = User::factory()->create(['ai_generations_count' => 15]);
        $user->assignRole('user');

        $plan = Plan::create([
            'name' => 'Jetsetter',
            'slug' => 'jetsetter',
            'price_cents' => 19900,
            'currency' => 'EGP',
            'ai_quota_monthly' => 100,
            'features' => ['AI Itineraries'],
        ]);

        Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'price_cents' => 19900,
            'renews_at' => now()->addMonth(),
        ]);

        $response = $this->actingAs($user, 'api')->getJson('/api/me/ai-quota');

        $response->assertStatus(200)
            ->assertJsonPath('data.plan_name', 'Jetsetter')
            ->assertJsonPath('data.ai_quota_total', 100)
            ->assertJsonPath('data.ai_quota_used', 15)
            ->assertJsonPath('data.ai_quota_remaining', 85)
            ->assertJsonPath('data.usage_percentage', 15);
    }

    public function test_ai_usage_service_consumes_and_restores_quota(): void
    {
        $user = User::factory()->create(['ai_generations_count' => 0]);

        $plan = Plan::create([
            'name' => 'Starter Plan',
            'slug' => 'starter-plan',
            'price_cents' => 1000,
            'currency' => 'USD',
            'ai_quota_monthly' => 5,
            'features' => ['AI Itineraries'],
        ]);

        Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'price_cents' => 2900,
            'renews_at' => now()->addMonth(),
        ]);

        $service = app(AiUsageService::class);

        // Consume 1 quota
        $service->consumeQuota($user);
        $this->assertEquals(1, $user->fresh()->ai_generations_count);

        // Restore 1 quota
        $service->restoreQuota($user);
        $this->assertEquals(0, $user->fresh()->ai_generations_count);
    }

    public function test_ai_usage_service_throws_exception_when_quota_exhausted(): void
    {
        $user = User::factory()->create(['ai_generations_count' => 2]);

        $plan = Plan::create([
            'name' => 'Mini Plan',
            'slug' => 'mini-plan',
            'price_cents' => 500,
            'currency' => 'USD',
            'ai_quota_monthly' => 2,
            'features' => ['AI Itineraries'],
        ]);

        Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'price_cents' => 2900,
            'renews_at' => now()->addMonth(),
        ]);

        $service = app(AiUsageService::class);

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('You have exhausted your monthly AI quota');

        $service->consumeQuota($user);
    }
}
