<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Booking::whereIn('status', ['paid', 'failed', 'refunded'])->get()->each(function (Booking $booking) {
            Payment::create([
                'booking_id' => $booking->id,
                'paymob_transaction_id' => (string) fake()->unique()->numberBetween(10000000, 99999999),
                'status' => $booking->status === 'paid' ? 'paid' : ($booking->status === 'refunded' ? 'refunded' : 'failed'),
                'amount_cents' => $booking->amount_cents,
                'currency' => $booking->currency,
                'card_type' => fake()->randomElement(['credit', 'debit']),
                'card_subtype' => fake()->randomElement(['Visa', 'MasterCard']),
                'card_pan' => 'XXXX-XXXX-'.fake()->numerify('####'),
                'hmac_valid' => true,
                'raw_payload' => ['order_id' => $booking->paymob_order_id, 'source' => 'seeder'],
            ]);
        });
    }
}
