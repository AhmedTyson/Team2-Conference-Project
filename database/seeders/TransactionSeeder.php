<?php

namespace Database\Seeders;

use App\Models\Commerce\Booking;
use App\Models\Commerce\Transaction;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Booking::whereIn('status', ['paid', 'refunded'])->get()->each(function (Booking $booking) {
            Transaction::create([
                'user_id' => $booking->user_id,
                'booking_id' => $booking->id,
                'type' => $booking->status === 'refunded' ? 'refund' : 'payment',
                'amount_cents' => $booking->amount_cents,
                'currency' => $booking->currency,
                'description' => $booking->status === 'refunded'
                    ? "Refund for booking #{$booking->id}"
                    : "Payment for booking #{$booking->id}",
                'metadata' => ['booking_status' => $booking->status],
            ]);
        });
    }
}
