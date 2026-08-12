<?php

namespace Tests\Feature\Database;

use App\Enums\SubscriptionStatus;
use App\Models\Account\User;
use App\Models\Commerce\Plan;
use App\Models\Commerce\Subscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SubscriptionUniquenessTest extends TestCase
{
    use RefreshDatabase;

    private function plan(): Plan
    {
        return Plan::factory()->create([
            'ai_quota_monthly' => 5,
            'price_cents' => 5000,
            'currency' => 'EGP',
        ]);
    }

    private function activeSub(User $user, Plan $plan): Subscription
    {
        return Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::ACTIVE,
            'price_cents' => $plan->price_cents,
            'currency' => $plan->currency,
            'started_at' => now(),
            'renews_at' => now()->addMonth(),
        ]);
    }

    private function inactiveSub(User $user, Plan $plan, string $status): Subscription
    {
        return Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => $status,
            'price_cents' => $plan->price_cents,
            'currency' => $plan->currency,
            'started_at' => now()->subMonth(),
            'renews_at' => now()->subDay(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DB-02 — Subscription uniqueness constraint tests
    |--------------------------------------------------------------------------
    */

    public function test_db02_one_active_subscription_allowed(): void
    {
        $user = User::factory()->create();
        $plan = $this->plan();

        $sub = $this->activeSub($user, $plan);
        $this->assertEquals(SubscriptionStatus::ACTIVE, $sub->status);
        $this->assertDatabaseCount('subscriptions', 1);
    }

    public function test_db02_second_active_subscription_for_same_user_rejected(): void
    {
        $user = User::factory()->create();
        $plan = $this->plan();

        $this->activeSub($user, $plan);

        $this->expectException(\Illuminate\Database\QueryException::class);

        $this->activeSub($user, $plan);
    }

    public function test_db02_different_users_can_both_have_active_subscriptions(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $plan = $this->plan();

        $subA = $this->activeSub($userA, $plan);
        $subB = $this->activeSub($userB, $plan);

        $this->assertEquals(SubscriptionStatus::ACTIVE, $subA->status);
        $this->assertEquals(SubscriptionStatus::ACTIVE, $subB->status);
        $this->assertDatabaseCount('subscriptions', 2);
    }

    public function test_db02_inactive_subscriptions_do_not_conflict(): void
    {
        $user = User::factory()->create();
        $plan = $this->plan();

        $this->inactiveSub($user, $plan, SubscriptionStatus::CANCELLED->value);
        $this->inactiveSub($user, $plan, SubscriptionStatus::EXPIRED->value);
        $this->inactiveSub($user, $plan, SubscriptionStatus::PAST_DUE->value);

        $this->assertDatabaseCount('subscriptions', 3);

        // Active subscription is still allowed alongside inactive ones.
        $this->activeSub($user, $plan);

        $this->assertDatabaseCount('subscriptions', 4);
    }

    public function test_db02_constraint_allows_one_active_after_cancellation(): void
    {
        $user = User::factory()->create();
        $plan = $this->plan();

        $sub1 = $this->activeSub($user, $plan);
        $sub1->update(['status' => SubscriptionStatus::CANCELLED]);

        // After cancelling the first, a new active is allowed.
        $sub2 = $this->activeSub($user, $plan);
        $this->assertEquals(SubscriptionStatus::ACTIVE, $sub2->status);
    }

    public function test_db02_constraint_exists_after_migration(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            $indexes = DB::select("PRAGMA index_list('subscriptions')");
            $found = false;
            foreach ($indexes as $idx) {
                if ($idx->name === 'subscriptions_active_user_unique' && $idx->unique === 1) {
                    $found = true;
                }
            }
            $this->assertTrue($found, 'Partial unique index subscriptions_active_user_unique not found.');
        } elseif ($driver === 'mysql') {
            $columns = DB::select("SHOW COLUMNS FROM subscriptions WHERE Field = 'active_user_id'");
            $this->assertNotEmpty($columns, 'Generated column active_user_id not found.');
        }
    }

    public function test_db02_migration_is_idempotent(): void
    {
        // Re-running migrate should be a no-op (no error, no duplicate index).
        $this->artisan('migrate')->assertExitCode(0);

        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            $count = DB::select(
                "SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='index' AND name='subscriptions_active_user_unique'"
            )[0]->cnt;
            $this->assertEquals(1, $count, 'Index should exist exactly once after re-running migrate.');
        }
    }

    public function test_db02_cancel_then_create_flow_still_works(): void
    {
        $user = User::factory()->create();
        $plan = $this->plan();

        $old = $this->activeSub($user, $plan);
        $old->update(['status' => SubscriptionStatus::CANCELLED]);

        $new = $this->activeSub($user, $plan);

        $this->assertCount(2, $user->subscriptions()->get());
        $this->assertEquals(SubscriptionStatus::CANCELLED, $old->fresh()->status);
        $this->assertEquals(SubscriptionStatus::ACTIVE, $new->fresh()->status);
    }

    public function test_db02_expired_does_not_block_new_active(): void
    {
        $user = User::factory()->create();
        $plan = $this->plan();

        $expired = $this->activeSub($user, $plan);
        $expired->update(['status' => SubscriptionStatus::EXPIRED]);

        // New active is allowed because expired is not 'active'.
        $new = $this->activeSub($user, $plan);
        $this->assertEquals(SubscriptionStatus::ACTIVE, $new->status);
    }

    public function test_db02_two_distinct_payments_race_protection(): void
    {
        $user = User::factory()->create();
        $plan = $this->plan();

        // Simulate: two payment flows attempting to create active subs.
        // One succeeds, the other must fail at DB level.
        $first = $this->activeSub($user, $plan);

        $threw = false;
        try {
            $this->activeSub($user, $plan);
        } catch (\Illuminate\Database\QueryException $e) {
            $threw = true;
        }

        $this->assertTrue($threw, 'Second concurrent active subscription must fail.');
        $this->assertEquals(SubscriptionStatus::ACTIVE, $first->fresh()->status);
    }
}
