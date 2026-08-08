<?php

namespace Database\Seeders;

use App\Models\ExperienceProvider;
use App\Models\User;
use Illuminate\Database\Seeder;

class ExperienceproviderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::inRandomOrder()->take(5)->get()->each(function (User $user) {
            ExperienceProvider::create([
                'user_id' => $user->id,
                'business_name' => fake()->company(),
                'bio' => fake()->paragraph(),
                'website' => fake()->url(),
                'phone' => fake()->phoneNumber(),
                'verified_at' => fake()->boolean(70) ? now() : null,
            ]);
        });
    }
}
