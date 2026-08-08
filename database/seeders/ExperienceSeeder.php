<?php

namespace Database\Seeders;

use App\Models\Destination;
use App\Models\Experience;
use App\Models\Experienceprovider;
use Illuminate\Database\Seeder;

class ExperienceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $providers = Experienceprovider::all();
        $destinationIds = Destination::pluck('id');

        if ($providers->isEmpty() || $destinationIds->isEmpty()) {
            $this->command?->warn('Skipping ExperienceSeeder: no experience_providers or destinations found.');

            return;
        }

        foreach (range(1, 20) as $i) {
            Experience::create([
                'provider_id' => $providers->random()->user_id,
                'destination_id' => $destinationIds->random(),
                'name' => fake()->words(3, true),
                'description' => fake()->paragraph(),
                'price_cents' => fake()->numberBetween(2000, 50000),
                'duration_minutes' => fake()->randomElement([60, 90, 120, 180, 240, null]),
                'max_participants' => fake()->numberBetween(1, 20),
                'status' => fake()->randomElement(['pending', 'approved', 'rejected']),
                'eco_score' => fake()->optional()->numberBetween(1, 10),
            ]);
        }
    }
}
