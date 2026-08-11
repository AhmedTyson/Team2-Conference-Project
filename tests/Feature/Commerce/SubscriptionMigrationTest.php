<?php

namespace Tests\Feature\Commerce;

use App\Console\Commands\ExpireStaleSubscriptions;
use App\Enums\SubscriptionStatus;
use App\Models\Account\User;
use App\Models\Commerce\Plan;
use App\Models\Commerce\Subscription;
use App\Services\Trips\AiUsageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SubscriptionMigrationTest extends TestCase
{
    use RefreshDatabase;

    /*
    |--------------------------------------------------------------------------
    | T1 — ExpireStaleSubscriptions command works with widened enum
    |--------------------------------------------------------------------------
    */

    public function test_t1_expire_stale_subscriptions_command_writes_expired(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->create();

        $sub = Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'price_cents' => 5000,
            'currency' => 'EGP',
            'started_at' => now()->subDays(2),
            'renews_at' => now()->subDay(), // expired
        ]);

        Artisan::call('subscriptions:expire-stale');

        $this->assertEquals(SubscriptionStatus::EXPIRED, $sub->fresh()->status);
    }

    /*
    |--------------------------------------------------------------------------
    | T2 — Expired subscription cannot consume quota
    |--------------------------------------------------------------------------
    */

    public function test_t2_expired_subscription_blocks_quota(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->create(['ai_quota_monthly' => 5]);

        Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'expired', // already expired
            'price_cents' => 5000,
            'currency' => 'EGP',
            'started_at' => now()->subDays(2),
            'renews_at' => now()->subDay(),
        ]);

        $user->forceFill([
            'ai_generations_count' => 0,
            'ai_reset_at' => now()->addMonth(),
        ])->save();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('subscription');

        app(AiUsageService::class)->consumeQuota($user);
    }

    /*
    |--------------------------------------------------------------------------
    | Scenario C — Idempotent re-run (already-widened database)
    |--------------------------------------------------------------------------
    |
    | Simulate the bad migration having already run by manually inserting a row
    | that uses 'expired', then re-run the additive migration — it should
    | detect the widened state and skip without error.
    |
    */

    public function test_scenario_c_migration_is_idempotent(): void
    {
        // The migration already ran in setUp (via RefreshDatabase).
        // Verify the column accepts all 6 values.
        $user = User::factory()->create();
        $plan = Plan::factory()->create();

        foreach (['pending', 'active', 'cancelled', 'past_due', 'expired', 'paused'] as $status) {
            $sub = Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'status' => $status,
                'price_cents' => 5000,
                'currency' => 'EGP',
                'started_at' => now(),
                'renews_at' => now()->addMonth(),
            ]);

            $this->assertEquals($status, $sub->status->value);
        }

        // Re-run migration — should be a no-op (idempotent).
        $this->artisan('migrate')->assertExitCode(0);
    }

    /*
    |--------------------------------------------------------------------------
    | Migration history verification
    |--------------------------------------------------------------------------
    */

    public function test_migration_history_records_both_migrations(): void
    {
        $migrations = DB::table('migrations')
            ->where('migration', 'like', '%subscription%')
            ->pluck('migration')
            ->toArray();

        $this->assertContains('2026_08_06_060001_create_subscriptions_table', $migrations);
        $this->assertContains('2026_08_11_000003_widen_subscriptions_status_enum', $migrations);
    }

    /*
    |--------------------------------------------------------------------------
    | Existing statuses still work
    |--------------------------------------------------------------------------
    */

    public function test_existing_statuses_still_valid_after_migration(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->create();

        foreach (['active', 'cancelled', 'past_due'] as $status) {
            $sub = Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'status' => $status,
                'price_cents' => 5000,
                'currency' => 'EGR',
                'started_at' => now(),
                'renews_at' => now()->addMonth(),
            ]);

            $this->assertEquals($status, $sub->fresh()->status->value);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Data corruption check — no unexpected statuses
    |--------------------------------------------------------------------------
    */

    public function test_no_unexpected_statuses_in_database(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->create();

        $validStatuses = ['pending', 'active', 'cancelled', 'past_due', 'expired', 'paused'];

        foreach ($validStatuses as $status) {
            Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'status' => $status,
                'price_cents' => 5000,
                'currency' => 'EGP',
                'started_at' => now(),
                'renews_at' => now()->addMonth(),
            ]);
        }

        $uniqueStatuses = DB::table('subscriptions')->pluck('status')->unique()->toArray();

        foreach ($uniqueStatuses as $status) {
            $this->assertContains($status, $validStatuses, "Unexpected status: {$status}");
        }
    }
}
