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
                'paymob_transaction_id' => (string) fake()->unique()->numberBetween(10000000, 99999999),
                'status' => $order->status->value === 'paid' ? 'paid' : ($order->status->value === 'refunded' ? 'refunded' : 'failed'),
                'amount_cents' => $order->total_cents,
                'currency' => $order->currency ?? 'USD',
                'card_type' => fake()->randomElement(['credit', 'debit']),
                'card_subtype' => fake()->randomElement(['Visa', 'MasterCard']),
                'card_pan' => 'XXXX-XXXX-'.fake()->numerify('####'),
                'hmac_valid' => true,
                'raw_payload' => ['order_id' => $order->id, 'source' => 'seeder'],
            ]);
        });
    }
}
