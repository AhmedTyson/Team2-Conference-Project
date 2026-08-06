<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\Commission;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CommissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Booking::where('status', 'paid')->get()->each(function (Booking $booking) {
            $item = BookingItem::where('booking_id', $booking->id)->first();
 
            if (! $item) {
                return;
            }
 
            $rate = fake()->randomFloat(4, 0.05, 0.20);
 
            Commission::create([
                'booking_id' => $booking->id,
                'source_type' => $item->itemable_type,
                'source_id' => $item->itemable_id,
                'rate' => $rate,
                'amount_cents' => (int) round($booking->amount_cents * $rate),
                'status' => fake()->randomElement(['pending', 'settled', 'cancelled']),
                'settled_at' => fake()->boolean(40) ? now() : null,
            ]);
        });
    }
}
