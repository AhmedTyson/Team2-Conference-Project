<?php

namespace Tests\Feature\Commerce;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Interfaces\Commerce\PaymentGatewayInterface;
use App\Models\Account\User;
use App\Models\Commerce\Order;
use App\Models\Commerce\Payment;
use App\Models\Commerce\Plan;
use App\Models\System\Setting;
use App\Models\Trips\Trip;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class CheckoutAbuseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mock(PaymentGatewayInterface::class, function ($mock) {
            $mock->shouldReceive('createIntention')->andReturn([
                'success' => true,
                'client_secret' => 'test_secret_123',
                'checkout_url' => 'https://checkout.example.com/test',
                'message' => 'Intention created successfully',
            ]);

            $mock->shouldReceive('verifyWebhook')->andReturn(true);
        });
    }

    private function makeTrip(User $user): Trip
    {
        return Trip::create([
            'user_id' => $user->id,
            'title' => 'Original Trip',
            'travel_style' => 'solo',
            'no_of_travelers' => 1,
            'budget' => 1000,
            'no_of_days' => 5,
            'start_date' => now()->addDays(5),
            'end_date' => now()->addDays(10),
            'status' => 'pending',
        ]);
    }

    public function test_p10_normal_checkout_succeeds(): void
    {
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        $response = $this->actingAs($user, 'api')->postJson('/api/checkout/initiate', [
            'type' => 'trip_fork',
            'trip_id' => $trip->id,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data' => ['order_id', 'client_secret', 'checkout_url']]);

        $orderId = $response->json('data.order_id');

        $this->assertDatabaseHas('orders', ['id' => $orderId, 'status' => OrderStatus::PENDING->value]);
        $this->assertDatabaseHas('payments', ['order_id' => $orderId, 'status' => PaymentStatus::PENDING->value]);
    }

    public function test_p17_trip_package_requires_ownership(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        $trip = $this->makeTrip($owner);

        $this->actingAs($intruder, 'api')
            ->postJson('/api/checkout/initiate', [
                'type' => 'trip_package',
                'trip_id' => $trip->id,
            ])
            ->assertStatus(403);

        $this->assertDatabaseMissing('orders', ['user_id' => $intruder->id]);
    }

    public function test_p11_checkout_exceeding_rate_limit_is_rejected(): void
    {
        Cache::flush();
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        for ($i = 0; $i < 5; $i++) {
            $this->actingAs($user, 'api')->postJson('/api/checkout/initiate', [
                'type' => 'trip_fork',
                'trip_id' => $trip->id,
            ])->assertStatus(200);
        }

        $this->actingAs($user, 'api')->postJson('/api/checkout/initiate', [
            'type' => 'trip_fork',
            'trip_id' => $trip->id,
        ])->assertStatus(429);
    }

    public function test_p12_repeated_checkout_attempts_cannot_cause_uncontrolled_gateway_calls(): void
    {
        Cache::flush();
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        for ($i = 0; $i < 10; $i++) {
            $this->actingAs($user, 'api')->postJson('/api/checkout/initiate', [
                'type' => 'trip_fork',
                'trip_id' => $trip->id,
            ]);
        }

        $this->assertLessThanOrEqual(5, Order::query()->where('user_id', $user->id)->count());
        $this->assertLessThanOrEqual(5, Payment::query()->count());
    }

    public function test_p13_valid_user_can_checkout_again_after_the_limiter_window(): void
    {
        Cache::flush();
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        for ($i = 0; $i < 5; $i++) {
            $this->actingAs($user, 'api')->postJson('/api/checkout/initiate', [
                'type' => 'trip_fork',
                'trip_id' => $trip->id,
            ])->assertStatus(200);
        }

        $limiter = RateLimiter::getFacadeRoot();
        $reflection = new \ReflectionClass($limiter);
        $cacheProperty = $reflection->getProperty('cache');
        $cacheProperty->setAccessible(true);
        $cache = $cacheProperty->getValue($limiter);
        $limitersProperty = $reflection->getProperty('limiters');
        $limitersProperty->setAccessible(true);
        $limiters = $limitersProperty->getValue($limiter);

        $this->actingAs($user, 'api')->postJson('/api/checkout/initiate', [
            'type' => 'trip_fork',
            'trip_id' => $trip->id,
        ])->assertStatus(429);

        // Simulate the 1-minute window elapsing.
        $userKey = $user->id;
        $hashKey = md5('checkout'.$userKey);
        $cleanKey = $limiter->cleanRateLimiterKey($hashKey);
        $timerKey = $cleanKey.':timer';

        // Check what key the limiter would use for the 6th request
        $reflection = new \ReflectionClass($limiter);
        $attemptsMethod = $reflection->getMethod('attempts');
        $attemptsMethod->setAccessible(true);
        $attempts = $attemptsMethod->invoke($limiter, $hashKey);

        Cache::put($timerKey, null, now()->addMinutes(10));

        // Try the 7th request
        $response = $this->actingAs($user, 'api')->postJson('/api/checkout/initiate', [
            'type' => 'trip_fork',
            'trip_id' => $trip->id,
        ]);
        $response->assertStatus(200);
    }

    public function test_p14_idempotency_key_reuses_the_same_checkout(): void
    {
        Cache::flush();
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        $first = $this->actingAs($user, 'api')->postJson('/api/checkout/initiate', [
            'type' => 'trip_fork',
            'trip_id' => $trip->id,
            'idempotency_key' => 'checkout-abc-123',
        ])->assertStatus(200);

        $second = $this->actingAs($user, 'api')->postJson('/api/checkout/initiate', [
            'type' => 'trip_fork',
            'trip_id' => $trip->id,
            'idempotency_key' => 'checkout-abc-123',
        ])->assertStatus(200);

        $this->assertEquals($first->json('data.order_id'), $second->json('data.order_id'));
        $this->assertEquals($first->json('data.checkout_url'), $second->json('data.checkout_url'));

        $this->assertEquals(1, Order::query()->where('user_id', $user->id)->count());
        $this->assertEquals(1, Payment::query()->count());
    }

    public function test_p15_trip_fork_checkout_still_calculates_server_side_amount(): void
    {
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        $settingPrice = (int) (Setting::where('key', 'trip_fork_price_cents')->value('value') ?: 50000);

        $response = $this->actingAs($user, 'api')->postJson('/api/checkout/initiate', [
            'type' => 'trip_fork',
            'trip_id' => $trip->id,
            'billing' => ['email' => 'attacker@example.com', 'phone_number' => '1111111111'],
        ])->assertStatus(200);

        $order = Order::find($response->json('data.order_id'));

        $this->assertEquals($settingPrice, $order->total_cents);
        $this->assertEquals($settingPrice, $order->items()->first()->price_cents);
    }

    public function test_p16_subscription_checkout_still_calculates_server_side_amount(): void
    {
        $user = User::factory()->create();
        $plan = Plan::create([
            'name' => 'Pro Plan',
            'price_cents' => 12345,
            'currency' => 'EGP',
            'billing_cycle' => 'monthly',
            'ai_quota_monthly' => 50,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user, 'api')->postJson('/api/checkout/initiate', [
            'type' => 'subscription',
            'plan_id' => $plan->id,
            'billing' => ['email' => 'attacker@example.com'],
        ])->assertStatus(200);

        $order = Order::find($response->json('data.order_id'));

        $this->assertEquals(12345, $order->total_cents);
        $this->assertEquals(12345, $order->items()->first()->price_cents);
    }
}
