<?php

namespace Database\Seeders;

use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReviewSeeder extends Seeder
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

        $reviews = [];

        for ($i = 0; $i < 50; $i++) {
            $reviews[] = [
                'user_id' => rand(1, 10),
                'reviewable_type' => $faker->randomElement($morphTargets),
                'reviewable_id' => rand(1, 15),
                'rating' => $faker->numberBetween(1, 5),
                'comment' => $faker->optional(0.8)->paragraph(), // 80% chance of comment
                'status' => $faker->randomElement(['pending', 'approved', 'rejected']),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('reviews')->insert($reviews);
    }
}
