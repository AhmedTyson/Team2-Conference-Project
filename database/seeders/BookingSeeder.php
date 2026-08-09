<?php

namespace Database\Seeders;

use App\Models\Account\User;
use App\Models\Commerce\Booking;
use Illuminate\Database\Seeder;

class BookingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tripIds = class_exists(Trip::class) ? Trip::pluck('id') : collect();

        User::inRandomOrder()->take(15)->get()->each(function (User $user) use ($tripIds) {
            $status = fake()->randomElement(['pending', 'processing', 'paid', 'failed', 'refunded']);

            Booking::create([
                'user_id' => $user->id,
                'trip_id' => $tripIds->isNotEmpty() ? fake()->optional()->randomElement($tripIds->all()) : null,
                'status' => $status,
                'amount_cents' => fake()->numberBetween(5000, 300000),
                'currency' => 'EGP',
                'paymob_order_id' => $status !== 'pending' ? (string) fake()->unique()->numberBetween(1000000, 9999999) : null,
                'payment_key' => $status !== 'pending' ? fake()->sha256() : null,
                'iframe_url' => $status !== 'pending' ? 'https://accept.paymob.com/api/acceptance/iframes/000000?payment_token='.fake()->uuid() : null,
                'first_name' => $user->first_name ?? fake()->firstName(),
                'last_name' => $user->last_name ?? fake()->lastName(),
                'email' => $user->email ?? fake()->safeEmail(),
                'phone_number' => fake()->phoneNumber(),
            ]);
        });
    }
}
