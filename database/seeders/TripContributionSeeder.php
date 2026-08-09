<?php

namespace Database\Seeders;

use App\Models\Trips\Trip;
use App\Models\Trips\TripContribution;
use Illuminate\Database\Seeder;

class TripContributionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Trip::all()->each(function (Trip $trip) {
            foreach (range(1, rand(0, 4)) as $i) {
                TripContribution::create([
                    'trip_id' => $trip->id,
                    'contributor_name' => fake()->name(),
                    'amount_cents' => fake()->numberBetween(1000, 50000),
                    'message' => fake()->optional()->sentence(),
                ]);
            }
        });
    }
}
