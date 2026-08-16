<?php

namespace Database\Seeders;

use App\Models\Account\User;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Restaurant;
use App\Models\Commerce\Order;
use App\Models\Commerce\OrderItem;
use App\Models\Commerce\Payment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReportSeeder extends Seeder
{
    /**
     * Seed rich, realistic analytics telemetry data for PDF reports & Admin Dashboard.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        // 1. Ensure Destinations exist
        $destNames = [
            'Cairo & Giza Pyramids', 'Paris Luxury & Fashion', 'Tokyo Culture & Tech',
            'London Heritage', 'Dubai Desert & Marina', 'Rome Ancient Wonders',
            'Bali Tropical Sanctuary', 'Santorini Island Sunset', 'Swiss Alps Zermatt',
            'Barcelona Tapas & Arts', 'New York Manhattan'
        ];

        $destinationIds = [];
        foreach ($destNames as $name) {
            $dest = Destination::firstOrCreate(
                ['name' => $name],
                [
                    'city_name' => explode(' ', $name)[0],
                    'country_id' => 1,
                    'description' => 'World-class destination for executive travel.',
                    'created_at' => now()->subMonths(6),
                    'updated_at' => now(),
                ]
            );
            $destinationIds[] = $dest->id;
        }

        // 2. Ensure Hotels exist with destination_id mapping
        $hotels = [
            ['Four Seasons Cairo', 450.00, 5, 4.9],
            ['The Ritz Paris', 980.00, 5, 4.9],
            ['Park Hyatt Tokyo', 620.00, 5, 4.8],
            ['The Savoy London', 550.00, 5, 4.7],
            ['Burj Al Arab Dubai', 1400.00, 5, 5.0],
            ['Hotel Eden Rome', 580.00, 5, 4.8],
            ['Viceroy Bali Resort', 390.00, 5, 4.9],
            ['Canaves Oia Santorini', 750.00, 5, 4.9],
        ];

        $hotelIds = [];
        foreach ($hotels as $idx => $h) {
            $destId = $destinationIds[$idx % count($destinationIds)];
            $hotel = Hotel::firstOrCreate(
                ['name' => $h[0]],
                [
                    'destination_id' => $destId,
                    'price_per_night' => $h[1],
                    'stars' => $h[2],
                    'rating' => $h[3],
                    'availability' => 1,
                    'image' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
                    'created_at' => now()->subMonths(6),
                    'updated_at' => now(),
                ]
            );
            $hotelIds[] = ['id' => $hotel->id, 'dest_id' => $destId, 'price' => $h[1]];
        }

        // 3. Ensure Restaurants exist with destination_id mapping
        $restaurants = [
            ['Naguib Mahfouz Cairo', 7500, 4.7],
            ['Le Meurice Alain Ducasse', 32000, 4.9],
            ['Sukiyabashi Jiro Tokyo', 40000, 5.0],
            ['Gordon Ramsay London', 25000, 4.8],
            ['Atmosphere Burj Khalifa', 31000, 4.9],
        ];

        $restaurantIds = [];
        foreach ($restaurants as $idx => $r) {
            $destId = $destinationIds[$idx % count($destinationIds)];
            $rest = Restaurant::firstOrCreate(
                ['name' => $r[0]],
                [
                    'destination_id' => $destId,
                    'cuisine' => 'Fine Dining',
                    'price_cents' => $r[1],
                    'rating' => $r[2],
                    'created_at' => now()->subMonths(6),
                    'updated_at' => now(),
                ]
            );
            $restaurantIds[] = ['id' => $rest->id, 'dest_id' => $destId, 'price' => $r[1] / 100];
        }

        // 4. Seed 30 Users spread over the past 6 months
        $userIds = User::pluck('id')->toArray();
        if (count($userIds) < 15) {
            for ($u = 1; $u <= 25; $u++) {
                $daysAgo = rand(5, 180);
                $createdDate = Carbon::now()->subDays($daysAgo);
                $user = User::create([
                    'name' => "Traveler " . rand(100, 999),
                    'email' => "traveler_" . time() . "_{$u}_" . rand(100, 999) . "@itinari.com",
                    'password' => bcrypt('password'),
                    'email_verified_at' => $createdDate,
                    'created_at' => $createdDate,
                    'updated_at' => $createdDate,
                ]);
                $user->assignRole('user');
                $userIds[] = $user->id;
            }
        }

        // 5. Seed 60 Orders, OrderItems & Paid Payments spread over the past 6 months
        $productTypes = ['Hotel', 'Restaurant', 'Flight', 'Trip', 'Package'];
        $statuses = ['paid', 'fulfilled', 'paid', 'fulfilled', 'pending'];

        for ($i = 1; $i <= 60; $i++) {
            $daysAgo = rand(1, 175);
            $orderDate = Carbon::now()->subDays($daysAgo)->setHour(rand(8, 22))->setMinute(rand(0, 59));
            $userId = $userIds[array_rand($userIds)];
            $status = $statuses[array_rand($statuses)];

            // Random order value between $350 and $4,500
            $totalCents = rand(350, 4500) * 100;

            $order = Order::create([
                'user_id' => $userId,
                'status' => $status,
                'total_cents' => $totalCents,
                'currency' => 'USD',
                'created_at' => $orderDate,
                'updated_at' => $orderDate,
            ]);

            // Seed order items
            $type = $productTypes[array_rand($productTypes)];
            if ($type === 'Hotel') {
                $hInfo = $hotelIds[array_rand($hotelIds)];
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_type' => Hotel::class,
                    'product_id' => $hInfo['id'],
                    'price_cents' => $totalCents,
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);
            } elseif ($type === 'Restaurant') {
                $rInfo = $restaurantIds[array_rand($restaurantIds)];
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_type' => Restaurant::class,
                    'product_id' => $rInfo['id'],
                    'price_cents' => $totalCents,
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);
            } else {
                // General Flight / Trip package item
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_type' => "App\\Models\\Catalog\\" . $type,
                    'product_id' => rand(1, 20),
                    'price_cents' => $totalCents,
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);
            }

            // Seed Paid Payment
            Payment::create([
                'order_id' => $order->id,
                'paymob_transaction_id' => 'TXN_' . strtoupper(substr(md5(uniqid()), 0, 10)),
                'status' => 'paid',
                'amount_cents' => $totalCents,
                'currency' => 'USD',
                'client_secret' => 'secret_' . md5($order->id),
                'checkout_url' => 'https://accept.paymob.com/unifiedcheckout/',
                'hmac_valid' => true,
                'raw_payload' => json_encode(['order_id' => $order->id, 'status' => 'paid']),
                'created_at' => $orderDate,
                'updated_at' => $orderDate,
            ]);
        }

        Schema::enableForeignKeyConstraints();
    }
}
