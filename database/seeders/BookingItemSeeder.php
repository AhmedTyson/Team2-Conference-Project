<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\BookingItem;
use App\Models\Experience;
use Illuminate\Database\Seeder;

class BookingItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $itemables = [Experience::class];
        $experiences = Experience::all();

        if ($experiences->isEmpty()) {
            $this->command?->warn('Skipping BookingItemSeeder: no experiences found.');

            return;
        }

        Booking::all()->each(function (Booking $booking) use ($itemables, $experiences) {
            foreach (range(1, rand(1, 3)) as $i) {
                $itemableType = $itemables[array_rand($itemables)];
                $item = $experiences->random();

                BookingItem::create([
                    'booking_id' => $booking->id,
                    'itemable_type' => $itemableType,
                    'itemable_id' => $item->id,
                    'quantity' => fake()->numberBetween(1, 4),
                    'unit_price_cents' => $item->price_cents ?? fake()->numberBetween(2000, 50000),
                ]);
            }
        });
    }
}
