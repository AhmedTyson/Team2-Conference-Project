<?php

namespace Tests\Feature\Commerce;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Events\PaymentSucceeded;
use App\Interfaces\Commerce\PaymentGatewayInterface;
use App\Models\Account\User;
use App\Models\Commerce\Order;
use App\Models\Commerce\Payment;
use App\Models\Commerce\Plan;
use App\Models\Commerce\Subscription;
use App\Models\Trips\Trip;
use App\Notifications\PaymentFailedNotification;
use App\Notifications\PaymentSucceededNotification;
use App\Notifications\SubscriptionActivatedNotification;
use App\Notifications\TripForkedNotification;
use App\Services\Trips\TripForkService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Mock the Payment Gateway to avoid actual API calls
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

    public function test_user_can_initiate_trip_fork_checkout()
    {
        $user = User::factory()->create();
        $trip = Trip::create([
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

        $response = $this->actingAs($user, 'api')->postJson('/api/v1/checkout/initiate', [
            'type' => 'trip_fork',
            'trip_id' => $trip->id,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data' => ['order_id', 'client_secret', 'checkout_url']]);

        $orderId = $response->json('data.order_id');

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'user_id' => $user->id,
            'status' => OrderStatus::PENDING->value,
        ]);

        $this->assertDatabaseHas('payments', [
            'order_id' => $orderId,
            'status' => PaymentStatus::PENDING->value,
        ]);
    }

    public function test_successful_webhook_fulfills_trip_fork()
    {
        Mail::fake();
        Notification::fake();

        $user = User::factory()->create();
        $sourceTrip = Trip::create([
            'user_id' => $user->id,
            'title' => 'Paris Adventure',
            'travel_style' => 'couple',
            'no_of_travelers' => 2,
            'budget' => 5000,
            'no_of_days' => 7,
            'start_date' => now()->addDays(10),
            'end_date' => now()->addDays(17),
            'status' => 'pending',
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'status' => OrderStatus::PENDING->value,
            'total_cents' => 50000,
            'currency' => 'EGP',
        ]);

        $order->items()->create([
            'product_type' => Trip::class,
            'product_id' => $sourceTrip->id,
            'price_cents' => 50000,
            'metadata' => ['purchase_type' => 'trip_fork'],
        ]);

        $merchantOrderId = 'ORDER_'.$order->id.'_12345';

        $payment = Payment::create([
            'order_id' => $order->id,
            'paymob_transaction_id' => $merchantOrderId,
            'status' => PaymentStatus::PENDING->value,
            'amount_cents' => 50000,
            'currency' => 'EGP',
            'hmac_valid' => false,
            'raw_payload' => [],
        ]);

        $payload = [
            'obj' => [
                'success' => true,
                'order' => ['merchant_order_id' => $merchantOrderId],
                'source_data' => ['type' => 'card', 'sub_type' => 'Visa', 'pan' => '1234'],
            ],
        ];

        // Hit Webhook
        $response = $this->postJson('/api/v1/paymob/webhook?hmac=valid_signature', $payload);
        $response->assertStatus(200);

        // Assert Payment & Order Updated
        $this->assertEquals(PaymentStatus::PAID, $payment->fresh()->status);
        $this->assertEquals(OrderStatus::FULFILLED, $order->fresh()->status); // Order gets fulfilled by listener

        // Assert Trip was forked
        $forkedTrip = Trip::where('parent_trip_id', $sourceTrip->id)->first();
        $this->assertNotNull($forkedTrip);
        $this->assertTrue($forkedTrip->is_fork);
        $this->assertEquals($user->id, $forkedTrip->user_id);

        Notification::assertSentTo($user, PaymentSucceededNotification::class);
        Notification::assertSentTo($sourceTrip->user, TripForkedNotification::class);
    }

    public function test_successful_webhook_fulfills_subscription_and_ai_quota()
    {
        Mail::fake();
        Notification::fake();
        $user = User::factory()->create(['ai_generations_count' => 5]);
        $plan = Plan::create([
            'name' => 'Pro Plan',
            'price_cents' => 100000,
            'currency' => 'EGP',
            'billing_cycle' => 'monthly',
            'ai_quota_monthly' => 50,
            'is_active' => true,
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'status' => OrderStatus::PENDING->value,
            'total_cents' => 100000,
            'currency' => 'EGP',
        ]);

        $order->items()->create([
            'product_type' => Plan::class,
            'product_id' => $plan->id,
            'price_cents' => 100000,
            'metadata' => ['purchase_type' => 'subscription'],
        ]);

        $merchantOrderId = 'ORDER_SUB_'.$order->id;

        Payment::create([
            'order_id' => $order->id,
            'paymob_transaction_id' => $merchantOrderId,
            'status' => PaymentStatus::PENDING->value,
            'amount_cents' => 100000,
            'currency' => 'EGP',
            'hmac_valid' => false,
            'raw_payload' => [],
        ]);

        $payload = [
            'obj' => [
                'success' => true,
                'order' => ['merchant_order_id' => $merchantOrderId],
            ],
        ];

        $response = $this->postJson('/api/v1/paymob/webhook?hmac=valid', $payload);
        $response->assertStatus(200);

        // Assert Subscription
        $subscription = Subscription::where('user_id', $user->id)->first();
        $this->assertNotNull($subscription);
        $this->assertEquals(SubscriptionStatus::ACTIVE, $subscription->status);
        $this->assertEquals($plan->id, $subscription->plan_id);

        // Assert AI Quota Reset
        $this->assertEquals(0, $user->fresh()->ai_generations_count);

        Notification::assertSentTo($user, SubscriptionActivatedNotification::class);
    }

    public function test_webhook_failure_marks_payment_and_order_failed_and_notifies()
    {
        Notification::fake();

        $user = User::factory()->create();

        $order = Order::create([
            'user_id' => $user->id,
            'status' => OrderStatus::PENDING->value,
            'total_cents' => 1000,
            'currency' => 'EGP',
        ]);

        $merchantOrderId = 'ORDER_FAIL_'.$order->id;

        $payment = Payment::create([
            'order_id' => $order->id,
            'paymob_transaction_id' => $merchantOrderId,
            'status' => PaymentStatus::PENDING->value,
            'amount_cents' => 1000,
            'currency' => 'EGP',
            'hmac_valid' => false,
            'raw_payload' => [],
        ]);

        $payload = [
            'obj' => [
                'success' => false,
                'order' => ['merchant_order_id' => $merchantOrderId],
                'source_data' => ['type' => 'card', 'sub_type' => 'Visa', 'pan' => '1234'],
            ],
        ];

        $response = $this->postJson('/api/v1/paymob/webhook?hmac=valid', $payload);
        $response->assertStatus(200);

        $this->assertEquals(PaymentStatus::FAILED, $payment->fresh()->status);
        $this->assertEquals(OrderStatus::FAILED, $order->fresh()->status);

        Notification::assertSentTo($user, PaymentFailedNotification::class);
    }

    public function test_fulfillment_failure_rolls_back_and_marks_order_failed()
    {
        Notification::fake();
        Mail::fake();

        $user = User::factory()->create();
        $sourceTrip = Trip::create([
            'user_id' => $user->id,
            'title' => 'Cairo Adventure',
            'travel_style' => 'solo',
            'no_of_travelers' => 1,
            'budget' => 3000,
            'no_of_days' => 4,
            'start_date' => now()->addDays(3),
            'end_date' => now()->addDays(7),
            'status' => 'pending',
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'status' => OrderStatus::PENDING->value,
            'total_cents' => 50000,
            'currency' => 'EGP',
        ]);

        $order->items()->create([
            'product_type' => Trip::class,
            'product_id' => $sourceTrip->id,
            'price_cents' => 50000,
            'metadata' => ['purchase_type' => 'trip_fork'],
        ]);

        $merchantOrderId = 'ORDER_BROKEN_'.$order->id;

        $payment = Payment::create([
            'order_id' => $order->id,
            'paymob_transaction_id' => $merchantOrderId,
            'status' => PaymentStatus::PENDING->value,
            'amount_cents' => 50000,
            'currency' => 'EGP',
            'hmac_valid' => false,
            'raw_payload' => [],
        ]);

        // Forking blows up midway (e.g. DB error, provider hiccup)
        $this->mock(TripForkService::class, function ($mock) {
            $mock->shouldReceive('fulfillFork')
                ->once()
                ->andThrow(new \RuntimeException('Fork provider unavailable'));
        });

        $payload = [
            'obj' => [
                'success' => true,
                'order' => ['merchant_order_id' => $merchantOrderId],
                'source_data' => ['type' => 'card', 'sub_type' => 'Visa', 'pan' => '1234'],
            ],
        ];

        $response = $this->postJson('/api/v1/paymob/webhook?hmac=valid', $payload);
        $response->assertStatus(200);

        // Payment was captured, but fulfillment failed → order flips to visible FAILED state
        $this->assertEquals(PaymentStatus::PAID, $payment->fresh()->status);
        $this->assertEquals(OrderStatus::FAILED, $order->fresh()->status);

        // No partial fork remains
        $this->assertDatabaseMissing('trips', ['parent_trip_id' => $sourceTrip->id]);

        Notification::assertSentTo($user, PaymentFailedNotification::class);
        Notification::assertNotSentTo($user, PaymentSucceededNotification::class);
    }

    public function test_listener_is_idempotent_for_subscription_fulfillment(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $plan = Plan::create([
            'name' => 'Pro Plan',
            'price_cents' => 100000,
            'currency' => 'EGP',
            'billing_cycle' => 'monthly',
            'ai_quota_monthly' => 50,
            'is_active' => true,
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'status' => OrderStatus::PAID->value,
            'total_cents' => 100000,
            'currency' => 'EGP',
        ]);

        $order->items()->create([
            'product_type' => Plan::class,
            'product_id' => $plan->id,
            'price_cents' => 100000,
            'metadata' => ['purchase_type' => 'subscription'],
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'paymob_transaction_id' => 'ORDER_RETRY_'.$order->id,
            'status' => PaymentStatus::PAID->value,
            'amount_cents' => 100000,
            'currency' => 'EGP',
            'hmac_valid' => false,
            'raw_payload' => [],
        ]);

        // Simulate a queued listener retry after a partial failure: fired twice
        event(new PaymentSucceeded($payment));
        event(new PaymentSucceeded($payment));

        $this->assertEquals(1, Subscription::query()->where('user_id', $user->id)->count());
        $this->assertEquals(OrderStatus::FULFILLED, $order->fresh()->status);
        Notification::assertSentTo($user, SubscriptionActivatedNotification::class, 1);
    }

    public function test_duplicate_webhook_post_is_ignored_after_first_processing(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $sourceTrip = Trip::create([
            'user_id' => $user->id,
            'title' => 'Source',
            'travel_style' => 'solo',
            'no_of_travelers' => 1,
            'budget' => 1000,
            'no_of_days' => 5,
            'start_date' => now()->addDays(5),
            'end_date' => now()->addDays(10),
            'status' => 'pending',
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'status' => OrderStatus::PENDING->value,
            'total_cents' => 50000,
            'currency' => 'EGP',
        ]);

        $order->items()->create([
            'product_type' => Trip::class,
            'product_id' => $sourceTrip->id,
            'price_cents' => 50000,
            'metadata' => ['purchase_type' => 'trip_fork'],
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'paymob_transaction_id' => 'ORDER_DUP_'.$order->id,
            'status' => PaymentStatus::PENDING->value,
            'amount_cents' => 50000,
            'currency' => 'EGP',
            'hmac_valid' => false,
            'raw_payload' => [],
        ]);

        $payload = [
            'obj' => [
                'success' => true,
                'order' => ['merchant_order_id' => 'ORDER_DUP_'.$order->id],
                'source_data' => ['type' => 'card', 'sub_type' => 'Visa', 'pan' => '1234'],
            ],
        ];

        $this->postJson('/api/v1/paymob/webhook?hmac=valid', $payload)->assertStatus(200);
        $this->postJson('/api/v1/paymob/webhook?hmac=valid', $payload)->assertStatus(200);

        $this->assertEquals(PaymentStatus::PAID, $payment->fresh()->status);
        $this->assertEquals(1, Trip::where('parent_trip_id', $sourceTrip->id)->count());
        Notification::assertSentTo($user, PaymentSucceededNotification::class, 1);
    }

    public function test_cancel_webhook_marks_order_failed_and_locks_terminal_state(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $sourceTrip = Trip::create([
            'user_id' => $user->id,
            'title' => 'Cancel Source',
            'travel_style' => 'solo',
            'no_of_travelers' => 1,
            'budget' => 1000,
            'no_of_days' => 5,
            'start_date' => now()->addDays(5),
            'end_date' => now()->addDays(10),
            'status' => 'pending',
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'status' => OrderStatus::PENDING->value,
            'total_cents' => 50000,
            'currency' => 'EGP',
        ]);

        $order->items()->create([
            'product_type' => Trip::class,
            'product_id' => $sourceTrip->id,
            'price_cents' => 50000,
            'metadata' => ['purchase_type' => 'trip_fork'],
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'paymob_transaction_id' => 'ORDER_CANCEL_'.$order->id,
            'status' => PaymentStatus::PENDING->value,
            'amount_cents' => 50000,
            'currency' => 'EGP',
            'hmac_valid' => false,
            'raw_payload' => [],
        ]);

        $cancelPayload = [
            'obj' => [
                'success' => false,
                'order' => ['merchant_order_id' => 'ORDER_CANCEL_'.$order->id],
                'source_data' => ['type' => 'card', 'sub_type' => 'Visa', 'pan' => '1234'],
            ],
        ];

        $this->postJson('/api/v1/paymob/webhook?hmac=valid', $cancelPayload)->assertStatus(200);

        $this->assertEquals(PaymentStatus::FAILED, $payment->fresh()->status);
        $this->assertEquals(OrderStatus::FAILED, $order->fresh()->status);
        $this->assertEquals(0, Trip::where('parent_trip_id', $sourceTrip->id)->count());
        Notification::assertSentTo($user, PaymentFailedNotification::class);

        // A later success webhook for the same transaction must NOT revive a canceled order
        $successPayload = $cancelPayload;
        $successPayload['obj']['success'] = true;

        $this->postJson('/api/v1/paymob/webhook?hmac=valid', $successPayload)->assertStatus(200);

        $this->assertEquals(PaymentStatus::FAILED, $payment->fresh()->status);
        $this->assertEquals(OrderStatus::FAILED, $order->fresh()->status);
        $this->assertEquals(0, Trip::where('parent_trip_id', $sourceTrip->id)->count());
    }
}
