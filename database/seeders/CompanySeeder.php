<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::inRandomOrder()->take(3)->get()->each(function (User $user) {
            Company::create([
                'name' => fake()->company(),
                'domain' => fake()->domainName(),
                'admin_user_id' => $user->id,
                'travel_budget_cents' => fake()->numberBetween(500000, 5000000),
            ]);
        });
    }
}
