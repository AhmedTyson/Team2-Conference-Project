<?php

namespace Database\Seeders;

use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FavouriteSeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create();

        $morphTargets = [
            'App\Models\Catalog\Destination',
            'App\Models\Catalog\Hotel',
            'App\Models\Catalog\Restaurant',
            'App\Models\Catalog\Attraction',
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
