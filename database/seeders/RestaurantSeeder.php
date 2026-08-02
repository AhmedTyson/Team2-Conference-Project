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
        if (!function_exists('database_path')) {
            $path = __DIR__ . '/../fixtures/restaurants.json';
        }

        if (!file_exists($path)) {
            echo "Fixture not found: {$path}\n";
            return;
        }

        $restaurants = json_decode(file_get_contents($path), true);
        $insertData = [];
        
        foreach ($restaurants as $rest) {
            $insertData[] = [
                'destination_id' => rand(1, 15), // Mock foreign key
                'category_id' => rand(1, 5),     // Mock foreign key
                'name' => $rest['name'],
                'cuisine' => $rest['cuisine'],
                'price_range' => $rest['price_range'],
                'rating' => $rest['rating'],
                'image' => $rest['image'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        DB::table('restaurants')->insert($insertData);
    }
}
