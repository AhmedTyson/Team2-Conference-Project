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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Monolog\Handler\TestHandler;
use Monolog\Logger;
use Tests\TestCase;

class PaymentSensitiveDataTest extends TestCase
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

    private function makePendingPayment(User $user, string $suffix = ''): array
    {
        $order = Order::create([
            'user_id' => $user->id,
            'status' => OrderStatus::PENDING,
            'total_cents' => 50000,
            'currency' => 'EGP',
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'paymob_transaction_id' => 'ORDER_'.$order->id.$suffix,
            'status' => PaymentStatus::PENDING,
            'amount_cents' => 50000,
            'currency' => 'EGP',
            'hmac_valid' => false,
            'raw_payload' => [],
        ]);

        return [$order, $payment];
    }

    public function test_p1_full_pan_is_never_persisted(): void
    {
        [$order, $payment] = $this->makePendingPayment(User::factory()->create());

        $this->postJson('/api/paymob/webhook?hmac=valid', [
            'obj' => [
                'success' => true,
                'order' => ['merchant_order_id' => $payment->paymob_transaction_id],
                'source_data' => ['type' => 'card', 'sub_type' => 'Visa', 'pan' => '4242424242424242'],
            ],
        ])->assertStatus(200);

        $stored = $payment->fresh()->card_pan;

        $this->assertNotEquals('4242424242424242', $stored);
        $this->assertStringNotContainsString('4242424242424242', (string) DB::table('payments')->where('id', $payment->id)->value('card_pan'));
    }

    public function test_p2_no_card_digits_are_stored(): void
    {
        [$order, $payment] = $this->makePendingPayment(User::factory()->create());

        $this->postJson('/api/paymob/webhook?hmac=valid', [
            'obj' => [
                'success' => true,
                'order' => ['merchant_order_id' => $payment->paymob_transaction_id],
                'source_data' => ['type' => 'card', 'sub_type' => 'Visa', 'pan' => '4242-4242-4242-9999'],
            ],
        ])->assertStatus(200);

        $this->assertNull($payment->fresh()->card_pan);
        $this->assertNotContains('card_pan', DB::getSchemaBuilder()->getColumnListing('payments'));
    }

    public function test_p3_raw_payload_is_encrypted_at_rest(): void
    {
        [$order, $payment] = $this->makePendingPayment(User::factory()->create());

        $payload = [
            'obj' => [
                'success' => true,
                'order' => ['merchant_order_id' => $payment->paymob_transaction_id],
                'source_data' => ['type' => 'card', 'sub_type' => 'Visa', 'pan' => '4242'],
            ],
        ];

        $this->postJson('/api/paymob/webhook?hmac=valid', $payload)->assertStatus(200);

        $raw = DB::table('payments')->where('id', $payment->id)->value('raw_payload');

        $this->assertIsString($raw);
        $this->assertStringNotContainsString('success', $raw);

        $envelope = json_decode(base64_decode($raw), true);
        $this->assertIsArray($envelope);
        $this->assertArrayHasKey('iv', $envelope);
        $this->assertArrayHasKey('value', $envelope);
        $this->assertArrayHasKey('mac', $envelope);

        $this->assertEquals($payload['obj'], $payment->fresh()->raw_payload['obj']);
    }

    public function test_p4_sensitive_fields_are_not_returned_by_payment_apis(): void
    {
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);

        $response = $this->actingAs($user, 'api')->postJson('/api/checkout/initiate', [
            'type' => 'trip_fork',
            'trip_id' => $trip->id,
        ]);

        $response->assertStatus(200);
        $response->assertJsonMissingPath('data.pan');
        $response->assertJsonMissingPath('data.raw_payload');
        $response->assertJsonMissingPath('data.source_data');
        $response->assertJsonStructure([
            'success',
            'data' => ['order_id', 'client_secret', 'checkout_url'],
        ]);
    }

    public function test_p5_sensitive_payment_data_is_not_written_to_logs(): void
    {
        $pan = '4242424242424242';

        $handler = new TestHandler;
        Log::extend('phase2_capture', function () use ($handler) {
            return new Logger('phase2_capture', [$handler]);
        });
        config(['logging.default' => 'phase2_capture']);

        [$order, $payment] = $this->makePendingPayment(User::factory()->create());

        $this->postJson('/api/paymob/webhook?hmac=valid', [
            'obj' => [
                'success' => true,
                'order' => ['merchant_order_id' => $payment->paymob_transaction_id],
                'source_data' => ['type' => 'card', 'sub_type' => 'Visa', 'pan' => $pan],
            ],
        ])->assertStatus(200);

        foreach ($handler->getRecords() as $record) {
            $context = json_encode($record['context'] ?? []);

            $this->assertStringNotContainsString(
                $pan,
                (string) $record['message'],
                'PAN leaked into a log message'
            );
            $this->assertStringNotContainsString(
                $pan,
                $context,
                'PAN leaked into a log context'
            );
        }
    }

    public function test_p6_webhook_processing_still_succeeds(): void
    {
        [$order, $payment] = $this->makePendingPayment(User::factory()->create());

        $response = $this->postJson('/api/paymob/webhook?hmac=valid', [
            'obj' => [
                'success' => true,
                'order' => ['merchant_order_id' => $payment->paymob_transaction_id],
            ],
        ]);

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertEquals(PaymentStatus::PAID, $payment->fresh()->status);
        $this->assertEquals(OrderStatus::FULFILLED, $order->fresh()->status);
    }

    public function test_p9_successful_payment_still_fulfills_the_correct_order(): void
    {
        $user = User::factory()->create();
        $trip = $this->makeTrip($user);
        [$order, $payment] = $this->makePendingPayment($user);

        $order->items()->create([
            'product_type' => Trip::class,
            'product_id' => $trip->id,
            'price_cents' => 50000,
            'metadata' => ['purchase_type' => 'trip_fork'],
        ]);

        $this->postJson('/api/paymob/webhook?hmac=valid', [
            'obj' => [
                'success' => true,
                'order' => ['merchant_order_id' => $payment->paymob_transaction_id],
            ],
        ])->assertStatus(200);

        $this->assertEquals(OrderStatus::FULFILLED, $order->fresh()->status);
        $this->assertNotNull(Trip::where('parent_trip_id', $trip->id)->first());
    }
}
