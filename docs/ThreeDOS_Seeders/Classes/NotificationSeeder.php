<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class NotificationSeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create();
        $notifications = [];
        
        // Assume users 1 to 10 exist
        for ($userId = 1; $userId <= 10; $userId++) {
            for ($i = 0; $i < 3; $i++) {
                $notifications[] = [
                    'user_id' => $userId,
                    'title' => $faker->sentence(3),
                    'type' => $faker->randomElement(['system', 'alert', 'itinerary_ready']),
                    'body' => $faker->paragraph(),
                    'data' => json_encode(['link' => '/dashboard']),
                    'status' => $faker->randomElement(['unread', 'read']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }
        
        DB::table('notifications')->insert($notifications);
    }
}
