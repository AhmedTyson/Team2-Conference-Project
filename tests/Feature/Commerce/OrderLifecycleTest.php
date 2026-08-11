<?php

namespace Tests\Feature\Commerce;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Interfaces\Commerce\PaymentGatewayInterface;
use App\Models\Account\User;
use App\Models\Commerce\Order;
use App\Models\Commerce\Payment;
use App\Models\Trips\Trip;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class OrderLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();

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

    private function makeOrderWithPayment(User $user, ?\Illuminate\Support\Carbon $createdAt = null, ?\Illuminate\Support\Carbon $expiresAt = null, ?Trip $trip = null): array
    {
        $order = Order::create([
            'user_id' => $user->id,
            'status' => OrderStatus::PENDING,
            'total_cents' => 50000,
            'currency' => 'EGP',
        ]);

        if ($trip) {
            $order->items()->create([
                'product_type' => Trip::class,
                'product_id' => $trip->id,
                'price_cents' => 50000,
                'metadata' => ['purchase_type' => 'trip_fork'],
            ]);
        }

        if ($createdAt) {
            $order->forceFill(['created_at' => $createdAt])->save();
        }

        if ($expiresAt) {
            $order->forceFill(['expires_at' => $expiresAt])->save();
        }

        $payment = Payment::create([
            'order_id' => $order->id,
            'paymob_transaction_id' => 'ORDER_'.$order->id,
            'status' => PaymentStatus::PENDING,
            'amount_cents' => 50000,
            'currency' => 'EGP',
            'hmac_valid' => false,
            'raw_payload' => [],
        ]);

        return [$order, $payment];
    }

    private function postWebhook(Payment $payment, bool $success): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/v1/paymob/webhook?hmac=valid', [
            'obj' => [
                'success' => $success,
                'order' => ['merchant_order_id' => $payment->paymob_transaction_id],
            ],
        ]);
    }

    public function test_p17_new_pending_order_is_active_during_the_normal_window(): void
    {
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        $response = $this->actingAs($user, 'api')->postJson('/api/v1/checkout/initiate', [
            'type' => 'trip_fork',
            'trip_id' => $trip->id,
        ])->assertStatus(200);

        $order = Order::find($response->json('data.order_id'));

        $this->assertEquals(OrderStatus::PENDING, $order->status);
        $this->assertNotNull($order->expires_at);
        $this->assertTrue($order->expires_at->greaterThan(now()->addMinutes(29)));
        $this->assertTrue($order->expires_at->lessThanOrEqualTo(now()->addMinutes(31)));
    }

    public function test_p18_order_becomes_expired_after_30_minutes(): void
    {
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        [$order] = $this->makeOrderWithPayment($user, now()->subMinutes(40), now()->subMinutes(10), $trip);

        $this->artisan('orders:expire-stale')->assertExitCode(0);

        $this->assertEquals(OrderStatus::EXPIRED, $order->fresh()->status);
    }

    public function test_p19_expired_order_cannot_initiate_normal_fulfillment(): void
    {
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        [$order] = $this->makeOrderWithPayment($user, now()->subMinutes(40), now()->subMinutes(10), $trip);

        $this->artisan('orders:expire-stale')->assertExitCode(0);

        // Expiry alone never fulfills or grants entitlements.
        $this->assertEquals(OrderStatus::EXPIRED, $order->fresh()->status);
        $this->assertEquals(0, Trip::where('parent_trip_id', $trip->id)->count());

        // A stale order is not reused for idempotent checkout — a new checkout is created.
        $response = $this->actingAs($user, 'api')->postJson('/api/v1/checkout/initiate', [
            'type' => 'trip_fork',
            'trip_id' => $trip->id,
            'idempotency_key' => 'stale-key-1',
        ])->assertStatus(200);

        $this->assertNotEquals($order->id, $response->json('data.order_id'));
    }

    public function test_p20_valid_payment_webhook_within_24h_grace_period_is_handled(): void
    {
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        // Order is 40 minutes old (past the 30-minute window, inside the grace period).
        [$order, $payment] = $this->makeOrderWithPayment($user, now()->subMinutes(40), now()->subMinutes(10), $trip);

        $this->artisan('orders:expire-stale')->assertExitCode(0);
        $this->assertEquals(OrderStatus::EXPIRED, $order->fresh()->status);

        $this->postWebhook($payment, true)->assertStatus(200)->assertJson(['success' => true]);

        $this->assertEquals(PaymentStatus::PAID, $payment->fresh()->status);
        $this->assertEquals(OrderStatus::FULFILLED, $order->fresh()->status);
        $this->assertNotNull(Trip::where('parent_trip_id', $trip->id)->first());
    }

    public function test_p21_webhook_after_24_hours_does_not_fulfill_the_order(): void
    {
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        // Order is 25 hours old — beyond the grace period.
        [$order, $payment] = $this->makeOrderWithPayment($user, now()->subHours(25), now()->subMinutes(10), $trip);

        $response = $this->postWebhook($payment, true);

        $response->assertStatus(200)
            ->assertJson(['success' => false, 'message' => 'Order expired beyond grace period']);

        $this->assertEquals(PaymentStatus::PENDING, $payment->fresh()->status);
        $this->assertEquals(OrderStatus::PENDING, $order->fresh()->status);
        $this->assertEquals(0, Trip::where('parent_trip_id', $trip->id)->count());
    }

    public function test_p22_late_webhook_cannot_grant_paid_entitlements(): void
    {
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        [$order, $payment] = $this->makeOrderWithPayment($user, now()->subHours(25), now()->subMinutes(10), $trip);

        $this->postWebhook($payment, true)->assertStatus(200)->assertJson(['success' => false]);

        $this->assertEquals(0, Trip::where('parent_trip_id', $trip->id)->count());
        $this->assertDatabaseMissing('subscriptions', ['user_id' => $user->id]);
        $this->assertEquals(0, $user->fresh()->ai_generations_count);
    }

    public function test_p23_duplicate_webhook_remains_idempotent(): void
    {
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        [$order, $payment] = $this->makeOrderWithPayment($user, null, null, $trip);

        $this->postWebhook($payment, true)->assertStatus(200);
        $this->postWebhook($payment, true)->assertStatus(200);

        $this->assertEquals(PaymentStatus::PAID, $payment->fresh()->status);
        $this->assertEquals(1, Trip::where('parent_trip_id', $trip->id)->count());
    }

    public function test_p24_expiration_and_payment_webhook_race_safely(): void
    {
        $user = User::factory()->create();

        // Race order A: cleanup first, webhook second (within grace) → fulfilled.
        $tripA = $this->makeTrip($user);
        [$orderA, $paymentA] = $this->makeOrderWithPayment($user, now()->subMinutes(40), now()->subMinutes(10), $tripA);
        $this->artisan('orders:expire-stale')->assertExitCode(0);
        $this->postWebhook($paymentA, true)->assertStatus(200)->assertJson(['success' => true]);
        $this->assertEquals(OrderStatus::FULFILLED, $orderA->fresh()->status);

        // Race order B: webhook first (fulfilled), cleanup second → untouched.
        $tripB = $this->makeTrip($user);
        [$orderB, $paymentB] = $this->makeOrderWithPayment($user, now()->subMinutes(40), now()->subMinutes(10), $tripB);
        $this->postWebhook($paymentB, true)->assertStatus(200)->assertJson(['success' => true]);
        $this->artisan('orders:expire-stale')->assertExitCode(0);
        $this->assertEquals(OrderStatus::FULFILLED, $orderB->fresh()->status);
    }

    public function test_p25_cleanup_preserves_payment_and_audit_history(): void
    {
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        [$order, $payment] = $this->makeOrderWithPayment($user, now()->subHours(2), now()->subMinutes(10), $trip);

        $this->artisan('orders:expire-stale')->assertExitCode(0);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => OrderStatus::EXPIRED->value,
        ]);
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'order_id' => $order->id,
            'status' => PaymentStatus::PENDING->value,
        ]);
        $this->assertDatabaseHas('order_items', ['order_id' => $order->id]);
    }
}
