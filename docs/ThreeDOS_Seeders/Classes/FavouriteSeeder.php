<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class FavouriteSeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create();
        
        $morphTargets = [
            'App\Models\Destination', 
            'App\Models\Hotel', 
            'App\Models\Restaurant', 
            'App\Models\Attraction'
        ];
        
        $favourites = [];
        
        for ($i = 0; $i < 30; $i++) {
            $favourites[] = [
                'user_id' => rand(1, 10),
                'favorable_type' => $faker->randomElement($morphTargets),
                'favorable_id' => rand(1, 15),
                'note' => $faker->optional(0.5)->sentence(), // 50% chance of note
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        DB::table('favourites')->insert($favourites);
    }
}
