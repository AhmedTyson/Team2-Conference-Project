<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Interfaces\PaymentGatewayInterface;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Trip;
use App\Models\User;
use App\Models\Subscription;
use App\Notifications\PaymentSucceededNotification;
use App\Notifications\TripForkedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
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

        $merchantOrderId = 'ORDER_' . $order->id . '_12345';

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
                'source_data' => ['type' => 'card', 'sub_type' => 'Visa', 'pan' => '1234']
            ]
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

        $merchantOrderId = 'ORDER_SUB_' . $order->id;

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
            ]
        ];

        $response = $this->postJson('/api/v1/paymob/webhook?hmac=valid', $payload);
        $response->assertStatus(200);

        // Assert Subscription
        $subscription = Subscription::where('user_id', $user->id)->first();
        $this->assertNotNull($subscription);
        $this->assertEquals(SubscriptionStatus::ACTIVE->value, $subscription->status);
        $this->assertEquals($plan->id, $subscription->plan_id);

        // Assert AI Quota Reset
        $this->assertEquals(0, $user->fresh()->ai_generations_count);

        Notification::assertSentTo($user, \App\Notifications\SubscriptionActivatedNotification::class);
    }
}
