<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RestaurantSeeder extends Seeder
{
    public function run()
    {
        $path = database_path('seeders/fixtures/restaurants.json');

        // Mock fallback if running without database path
        if (! function_exists('database_path')) {
            $path = __DIR__.'/../fixtures/restaurants.json';
        }

        if (! file_exists($path)) {
            echo "Fixture not found: {$path}\n";

            return;
        }

        $restaurants = json_decode(file_get_contents($path), true);
        $insertData = [];

        foreach ($restaurants as $rest) {
            $priceRange = $rest['price_range'] ?? '$';
            $priceCents = match ($priceRange) {
                '$$$' => rand(60000, 120000),
                '$$' => rand(30000, 60000),
                default => rand(15000, 30000),
            };

            $insertData[] = [
                'destination_id' => rand(1, 15), // Mock foreign key
                'category_id' => rand(1, 5),     // Mock foreign key
                'name' => $rest['name'],
                'cuisine' => $rest['cuisine'],
                'price_range' => $rest['price_range'],
                'price_cents' => $priceCents,
                'rating' => $rest['rating'],
                'image' => $rest['image'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('restaurants')->insert($insertData);
    }
}
