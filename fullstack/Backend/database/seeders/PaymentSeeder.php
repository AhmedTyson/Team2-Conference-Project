<?php

namespace Database\Seeders;

use App\Models\Commerce\Order;
use App\Models\Commerce\Payment;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Order::query()->get()->each(function (Order $order) {
            Payment::create([
                'order_id' => $order->id,
                'paymob_transaction_id' => 'ORDER_'.$order->id.'_'.time(),
                'status' => $order->status->value === 'paid' ? 'paid' : ($order->status->value === 'refunded' ? 'refunded' : 'pending'),
                'amount_cents' => $order->total_cents,
                'currency' => $order->currency ?? 'EGP',
                'client_secret' => 'mock_client_secret_'.fake()->hexColor(),
                'checkout_url' => 'https://accept.paymob.com/unifiedcheckout/?publicKey=mock&clientSecret=mock',
                'hmac_valid' => true,
                'raw_payload' => json_encode(['order_id' => $order->id, 'source' => 'seeder']),
            ]);
        });
    }
}
