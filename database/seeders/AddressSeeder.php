<?php

namespace Database\Seeders;

use App\Models\Account\User;
use App\Models\Catalog\Experience;
use App\Models\Commerce\Address;
use Illuminate\Database\Seeder;

class AddressSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::inRandomOrder()->take(10)->get()->each(function (User $user) {
            Address::create([
                'addressable_type' => User::class,
                'addressable_id' => $user->id,
                'line1' => fake()->streetAddress(),
                'line2' => fake()->optional()->secondaryAddress(),
                'city' => fake()->city(),
                'state' => fake()->optional()->state(),
                'country' => fake()->country(),
                'postal_code' => fake()->optional()->postcode(),
                'lat' => fake()->latitude(),
                'lng' => fake()->longitude(),
            ]);
        });

        Experience::inRandomOrder()->take(10)->get()->each(function (Experience $experience) {
            Address::create([
                'addressable_type' => Experience::class,
                'addressable_id' => $experience->id,
                'line1' => fake()->streetAddress(),
                'line2' => fake()->optional()->secondaryAddress(),
                'city' => fake()->city(),
                'state' => fake()->optional()->state(),
                'country' => fake()->country(),
                'postal_code' => fake()->optional()->postcode(),
                'lat' => fake()->latitude(),
                'lng' => fake()->longitude(),
            ]);
        });
    }
}
