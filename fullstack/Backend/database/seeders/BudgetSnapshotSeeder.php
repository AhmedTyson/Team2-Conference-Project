<?php

namespace Database\Seeders;

use App\Models\Trips\BudgetSnapshot;
use App\Models\Trips\Trip;
use Illuminate\Database\Seeder;

class BudgetSnapshotSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Trip::all()->each(function (Trip $trip) {
            $total = fake()->numberBetween(100000, 2000000);
            $hotels = fake()->numberBetween(0, (int) ($total * 0.4));
            $flights = fake()->numberBetween(0, (int) ($total * 0.4));
            $restaurants = fake()->numberBetween(0, (int) ($total * 0.2));
            $spent = $hotels + $flights + $restaurants;

            BudgetSnapshot::create([
                'trip_id' => $trip->id,
                'total_budget_cents' => $total,
                'spent_cents' => $spent,
                'remaining_cents' => max($total - $spent, 0),
                'breakdown' => [
                    'hotels' => $hotels,
                    'flights' => $flights,
                    'restaurants' => $restaurants,
                ],
                'recorded_at' => now(),
            ]);
        });
    }
}
