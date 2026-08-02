<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HotelSeeder extends Seeder
{
    public function run()
    {
        $path = database_path('seeders/fixtures/hotels.json');
        
        // Mock fallback if running without database path
        if (!function_exists('database_path')) {
            $path = __DIR__ . '/../fixtures/hotels.json';
        }

        if (!file_exists($path)) {
            echo "Fixture not found: {$path}\n";
            return;
        }

        $hotels = json_decode(file_get_contents($path), true);
        $insertData = [];
        
        foreach ($hotels as $hotel) {
            $insertData[] = [
                'destination_id' => rand(1, 15), // Mock foreign key
                'name' => $hotel['name'],
                'price_per_night' => $hotel['price'],
                'rating' => $hotel['rating'],
                'stars' => $hotel['stars'],
                'image' => $hotel['image'],
                'availability' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        DB::table('hotels')->insert($insertData);
    }
}
