<?php

namespace Tests\Feature\Commerce;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\PaymentSucceeded;
use App\Interfaces\Commerce\PaymentGatewayInterface;
use App\Models\Account\User;
use App\Models\Commerce\Order;
use App\Models\Commerce\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mock(PaymentGatewayInterface::class, function ($mock) {
            $mock->shouldReceive('verifyWebhook')->andReturn(true);
        });
    }

    public function test_webhook_idempotency_prevents_duplicate_processing()
    {
        Event::fake();

        $user = User::factory()->create();
        $order = Order::create([
            'user_id' => $user->id,
            'status' => OrderStatus::PENDING->value,
            'total_cents' => 1000,
            'currency' => 'EGP',
        ]);

        $merchantOrderId = 'ORDER_RACE_'.$order->id;

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
                'success' => true,
                'order' => ['merchant_order_id' => $merchantOrderId],
            ],
        ];

        // Simulate a race condition by acquiring the lock manually before the request hits,
        // simulating another thread currently processing the exact same webhook.
        $lock = Cache::lock("paymob_webhook_processing_{$merchantOrderId}", 15);
        $lock->get();

        $response = $this->postJson('/api/paymob/webhook?hmac=valid', $payload);

        // The webhook should gracefully return 200 (Already processing) to prevent Paymob from retrying,
        // but it MUST NOT dispatch the PaymentSucceeded event or update the DB.
        $response->assertStatus(200);
        $response->assertJson(['message' => 'Already processing']);

        // Assert DB is untouched
        $this->assertEquals(PaymentStatus::PENDING, $payment->fresh()->status);

        // Assert Event was NEVER fired
        Event::assertNotDispatched(PaymentSucceeded::class);

        $lock->release();

        // Now hit it again without the lock
        $response2 = $this->postJson('/api/paymob/webhook?hmac=valid', $payload);
        $response2->assertStatus(200);
        $response2->assertJson(['message' => 'Processed']);

        // Assert Event IS fired this time
        Event::assertDispatched(PaymentSucceeded::class, 1);
        $this->assertEquals(PaymentStatus::PAID, $payment->fresh()->status);

        // Hit it a THIRD time (after it's fully paid)
        $response3 = $this->postJson('/api/paymob/webhook?hmac=valid', $payload);
        $response3->assertStatus(200);
        $response3->assertJson(['message' => 'Already processed']);

        // Assert Event is STILL only fired exactly once total
        Event::assertDispatched(PaymentSucceeded::class, 1);
    }
}
