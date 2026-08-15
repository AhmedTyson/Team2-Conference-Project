<?php

namespace Tests\Feature\Commerce;

use App\Models\Account\User;
use App\Models\Commerce\Plan;
use App\Models\Commerce\Subscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PlansTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'api']);
        $userRole = Role::create(['name' => 'user', 'guard_name' => 'api']);

        foreach ([
            'manage plans',
            'get plans',
            'subscribe to plans',
            'upgrade plans',
            'cancel subscription',
            'view my subscription',
        ] as $permission) {
            Permission::create(['name' => $permission, 'guard_name' => 'api']);
        }

        $adminRole->syncPermissions(['manage plans']);
        $userRole->syncPermissions([
            'get plans',
            'subscribe to plans',
            'upgrade plans',
            'cancel subscription',
            'view my subscription',
        ]);
    }

    private function adminUser(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        return $admin;
    }

    private function regularUser(): User
    {
        $user = User::factory()->create();
        $user->assignRole('user');

        return $user;
    }

    public function test_admin_can_set_plans(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin, 'api')->postJson('/api/admin/set-plans', [
            'plans' => [
                [
                    'name' => 'Pro',
                    'price_cents' => 19900,
                    'billing_cycle' => 'monthly',
                    'ai_quota_monthly' => 50,
                    'features' => ['Unlimited trips', '50 AI generations / month'],
                ],
                [
                    'name' => 'Business',
                    'price_cents' => 49900,
                    'billing_cycle' => 'monthly',
                    'ai_quota_monthly' => 200,
                    'features' => ['API access'],
                ],
            ],
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseCount('plans', 2);
        $this->assertDatabaseHas('plans', ['name' => 'Pro', 'price_cents' => 19900]);
    }

    public function test_set_plans_rejects_non_admin(): void
    {
        $user = $this->regularUser();

        $this->actingAs($user, 'api')->postJson('/api/admin/set-plans', [
            'plans' => [['name' => 'Pro', 'price_cents' => 100]],
        ])->assertStatus(403);
    }

    public function test_set_plans_validation_rejects_bad_payload(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin, 'api')->postJson('/api/admin/set-plans', [
            'plans' => [['name' => '', 'price_cents' => -5]],
        ])->assertStatus(422);
    }

    public function test_user_can_list_plans(): void
    {
        $user = $this->regularUser();
        Plan::factory()->count(2)->create(['is_active' => true]);
        Plan::factory()->create(['is_active' => false]);

        $response = $this->actingAs($user, 'api')->getJson('/api/plans');

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertCount(2, $response->json('data'));
    }

    public function test_plans_are_publicly_accessible(): void
    {
        $this->getJson('/api/plans')->assertStatus(200);
    }

    public function test_direct_subscribe_redirects_to_checkout(): void
    {
        $user = $this->regularUser();
        $plan = Plan::factory()->create(['price_cents' => 19900, 'ai_quota_monthly' => 50]);

        $response = $this->actingAs($user, 'api')->postJson('/api/me/subscribe', [
            'plan_id' => $plan->id,
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('error.message', 'Direct subscriptions are disabled. Please use the /api/checkout/initiate endpoint to purchase a subscription.');
        $this->assertDatabaseCount('subscriptions', 0);
    }

    public function test_direct_subscribe_gated_even_with_active_subscription(): void
    {
        $user = $this->regularUser();
        $plan = Plan::factory()->create();
        Subscription::factory()->create(['user_id' => $user->id, 'plan_id' => $plan->id, 'status' => 'active']);

        $this->actingAs($user, 'api')->postJson('/api/me/subscribe', [
            'plan_id' => $plan->id,
        ])->assertStatus(400);
    }

    public function test_subscribe_to_inactive_plan_rejected(): void
    {
        $user = $this->regularUser();
        $plan = Plan::factory()->create(['is_active' => false]);

        $this->actingAs($user, 'api')->postJson('/api/me/subscribe', [
            'plan_id' => $plan->id,
        ])->assertStatus(422);
    }

    public function test_direct_upgrade_disabled_with_active_subscription(): void
    {
        $user = $this->regularUser();
        $current = Plan::factory()->create(['price_cents' => 19900]);
        $target = Plan::factory()->create(['price_cents' => 49900]);
        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $current->id,
            'status' => 'active',
            'price_cents' => 19900,
            'started_at' => now()->subDays(10),
            'renews_at' => now()->addDays(20),
        ]);

        $response = $this->actingAs($user, 'api')->postJson('/api/me/upgrade', [
            'plan_id' => $target->id,
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('error.message', 'Direct upgrades are disabled. Please use the /api/checkout/initiate endpoint to upgrade.');
    }

    public function test_direct_upgrade_disabled_without_subscription(): void
    {
        $user = $this->regularUser();
        $plan = Plan::factory()->create();

        $this->actingAs($user, 'api')->postJson('/api/me/upgrade', [
            'plan_id' => $plan->id,
        ])->assertStatus(400);
    }

    public function test_user_can_cancel_active_subscription(): void
    {
        $user = $this->regularUser();
        $plan = Plan::factory()->create();
        Subscription::factory()->create(['user_id' => $user->id, 'plan_id' => $plan->id, 'status' => 'active']);

        $response = $this->actingAs($user, 'api')->postJson('/api/me/subscription/cancel');

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseHas('subscriptions', [
            'user_id' => $user->id,
            'status' => 'cancelled',
            'renews_at' => null,
        ]);
    }

    public function test_cancel_without_active_subscription_rejected(): void
    {
        $user = $this->regularUser();

        $this->actingAs($user, 'api')->postJson('/api/me/subscription/cancel')->assertStatus(422);
    }

    public function test_user_can_view_subscription_with_plan(): void
    {
        $user = $this->regularUser();
        $plan = Plan::factory()->create(['name' => 'Pro']);
        Subscription::factory()->create(['user_id' => $user->id, 'plan_id' => $plan->id, 'status' => 'active']);

        $response = $this->actingAs($user, 'api')->getJson('/api/me/subscription');

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertSame('Pro', $response->json('data.plan.name'));
        $this->assertSame('active', $response->json('data.status'));
    }

    public function test_subscription_view_empty_when_never_subscribed(): void
    {
        $user = $this->regularUser();

        $this->actingAs($user, 'api')->getJson('/api/me/subscription')
            ->assertStatus(200)
            ->assertJsonPath('data', null);
    }

    public function test_user_can_get_single_plan_by_id(): void
    {
        $user = $this->regularUser();
        $plan = Plan::factory()->create(['name' => 'Pro Plan', 'is_active' => true]);

        $response = $this->actingAs($user, 'api')->getJson("/api/plans/{$plan->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.id', $plan->id)
            ->assertJsonPath('data.name', 'Pro Plan');
    }

    public function test_cannot_get_inactive_plan_by_id(): void
    {
        $user = $this->regularUser();
        $plan = Plan::factory()->create(['name' => 'Deprecated Plan', 'is_active' => false]);

        $this->actingAs($user, 'api')->getJson("/api/plans/{$plan->id}")
            ->assertStatus(404);
    }

    public function test_single_plan_is_publicly_accessible(): void
    {
        $plan = Plan::factory()->create(['is_active' => true]);

        $this->getJson("/api/plans/{$plan->id}")->assertStatus(200);
    }
}
