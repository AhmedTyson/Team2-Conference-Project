<?php

namespace Tests\Feature\Commerce;

use App\Models\Account\User;
use App\Models\Commerce\Order;
use App\Models\Commerce\Payment;
use App\Models\Commerce\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PaymobPaymentCycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'user', 'guard_name' => 'api']);
    }

    public function test_initiate_paymob_checkout_creates_order_and_returns_checkout_url(): void
    {
        Http::fake([
            'https://accept.paymob.com/v1/intention/' => Http::response([
                'cs' => 'test_client_secret_xyz123',
                'id' => '588891020',
            ], 200),
        ]);

        $user = User::factory()->create();

        $plan = Plan::create([
            'name' => 'Pro Plan',
            'slug' => 'pro-plan',
            'price_cents' => 2900,
            'currency' => 'EGP',
            'ai_quota_monthly' => 500,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user, 'api')->postJson('/api/checkout/initiate', [
            'type' => 'subscription',
            'plan_id' => $plan->id,
            'gateway' => 'paymob',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['checkout_url', 'order_id']]);

        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
        ]);
    }

    public function test_paymob_callback_fulfills_order_and_payment_in_database(): void
    {
        $user = User::factory()->create();

        $order = Order::create([
            'user_id' => $user->id,
            'status' => 'pending',
            'total_cents' => 829500,
            'currency' => 'EGP',
            'merchant_order_id' => 'ORDER_61_1786905129',
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'paymob_transaction_id' => 'ORDER_61_1786905129',
            'amount_cents' => 829500,
            'currency' => 'EGP',
            'status' => 'pending',
            'hmac_valid' => false,
            'raw_payload' => '{}',
        ]);

        $callbackUrl = '/api/v1/paymob/callback?id=516712546&pending=false&amount_cents=829500&success=true&is_auth=false&is_capture=false&is_standalone_payment=true&is_voided=false&is_refunded=false&is_3d_secure=true&integration_id=5821687&profile_id=1210730&has_parent_transaction=false&order=588891020&created_at=2026-08-16T21%3A32%3A17.915812&currency=EGP&merchant_commission=0&accept_fees=0&discount_details=%5B%5D&amount_cents_int=829500&is_void=false&is_refund=false&error_occured=false&refunded_amount_cents=0&refunded_amount_cents_int=0&captured_amount=0&captured_amount_int=0&settlement_amount_cents_int=0&accept_fees_cents_int=0&vat_cents_int=0&updated_at=2026-08-16T21%3A32%3A45.222421&is_settled=false&bill_balanced=false&is_bill=false&owner=2426325&merchant_order_id=ORDER_61_1786905129&data.message=Approved&source_data.type=card&source_data.pan=1111&source_data.sub_type=Visa&acq_response_code=00&txn_response_code=APPROVED';

        $response = $this->get($callbackUrl);

        $response->assertRedirect();
        $this->assertStringContainsString('/app/payment-success.html', $response->headers->get('Location'));

        $orderStatus = is_object($order->fresh()->status) ? $order->fresh()->status->value : $order->fresh()->status;
        $paymentStatus = is_object($payment->fresh()->status) ? $payment->fresh()->status->value : $payment->fresh()->status;

        $this->assertEquals('fulfilled', $orderStatus);
        $this->assertEquals('paid', $paymentStatus);
    }
}
