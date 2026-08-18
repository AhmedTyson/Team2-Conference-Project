<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsSeeder extends Seeder
{
    /**
     * Run the analytics data seeder.
     *
     * @return void
     */
    public function run()
    {
        // 1. Seed Users over the last 6 months
        $usersCount = DB::table('users')->count();
        if ($usersCount < 30) {
            $roles = ['user', 'user', 'user', 'agency'];
            for ($i = 1; $i <= 35; $i++) {
                $daysAgo = rand(1, 180);
                $date = Carbon::now()->subDays($daysAgo)->toDateTimeString();
                DB::table('users')->insertOrIgnore([
                    'name' => 'Passenger '.rand(100, 999),
                    'email' => 'passenger_'.$i.'_'.rand(1000, 9999).'@itinera.com',
                    'password' => bcrypt('password'),
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);
            }
        }

        // Fetch user IDs
        $userIds = DB::table('users')->pluck('id')->toArray();
        if (empty($userIds)) {
            $userIds = [1];
        }

        // 2. Seed Trips with realistic travel styles, budgets, and dates over 6 months
        $styles = ['luxury', 'cultural', 'adventure', 'family', 'relaxation', 'business', 'couple', 'friends'];
        $titles = [
            'Paris Luxury Escape', 'Tokyo Sakura Exploration', 'Cairo Ancient Wonders',
            'London High Street Adventure', 'Dubai Desert & Skyline Luxury', 'Rome Colosseum & Vatican Tour',
            'Amalfi Coast Resort Escape', 'Bali Tropical Wellness Retreat', 'Swiss Alps Hiking Expedition',
            'Barcelona Tapas & Architecture', 'New York Manhattan Tour', 'Santorini Island Sunset Cruise',
            'Kyoto Historic Shrines Walk', 'Reykjavik Northern Lights Trail', 'Maldives Private Villa Getaway',
            'Istanbul Bosphorus Cruise', 'Vienna Classical Music Safari', 'Sydney Opera & Coastal Walk',
        ];

        $statuses = ['booked', 'completed', 'planned', 'booked', 'completed'];

        for ($i = 0; $i < 45; $i++) {
            $daysAgo = rand(1, 180);
            $startDate = Carbon::now()->subDays($daysAgo);
            $endDate = (clone $startDate)->addDays(rand(4, 12));
            $budget = rand(15, 120) * 100; // $1,500 - $12,000
            $style = $styles[array_rand($styles)];
            $title = $titles[array_rand($titles)].' #'.rand(10, 99);
            $status = $statuses[array_rand($statuses)];
            $userId = $userIds[array_rand($userIds)];

            DB::table('trips')->insert([
                'title' => $title,
                'travel_style' => $style,
                'no_of_travelers' => rand(1, 6),
                'budget' => $budget,
                'no_of_days' => rand(4, 12),
                'start_date' => $startDate->toDateTimeString(),
                'end_date' => $endDate->toDateTimeString(),
                'status' => $status,
                'estimated_cost' => $budget * rand(90, 115) / 100,
                'user_id' => $userId,
                'created_at' => $startDate->toDateTimeString(),
                'updated_at' => $startDate->toDateTimeString(),
            ]);
        }

        // 3. Seed Flights across 24-hour departure spectrum & top airports
        $airlines = ['Emirates', 'British Airways', 'EgyptAir', 'Air France', 'Lufthansa', 'Qatar Airways', 'Delta Air Lines'];
        $airports = ['CAI', 'LHR', 'JFK', 'CDG', 'DXB', 'FCO', 'HND', 'SYD'];

        for ($i = 0; $i < 60; $i++) {
            $daysOffset = rand(-30, 60);
            $hour = rand(0, 23);
            $depDate = Carbon::now()->addDays($daysOffset)->setHour($hour)->setMinute(rand(0, 59));
            $arrDate = (clone $depDate)->addHours(rand(2, 12));

            $dep = $airports[array_rand($airports)];
            $arr = $airports[array_rand($airports)];
            while ($arr === $dep) {
                $arr = $airports[array_rand($airports)];
            }

            DB::table('flights')->insert([
                'airline' => $airlines[array_rand($airlines)],
                'flight_number' => strtoupper(substr($dep, 0, 2)).'-'.rand(100, 999),
                'departure_airport' => $dep,
                'arrival_airport' => $arr,
                'departure_date' => $depDate->toDateTimeString(),
                'arrival_date' => $arrDate->toDateTimeString(),
                'price' => rand(250, 1850),
                'booking_status' => rand(0, 1) ? 'pending' : 'confirmed',
                'created_at' => Carbon::now()->subDays(rand(1, 90))->toDateTimeString(),
                'updated_at' => Carbon::now()->toDateTimeString(),
            ]);
        }
    }
}
