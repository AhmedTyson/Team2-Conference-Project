<?php

namespace Database\Seeders;

use App\Models\Account\User;
use App\Models\Account\UserPoint;
use Illuminate\Database\Seeder;

class UserPointSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $actions = ['review_approved', 'booking_paid', 'referral'];

        User::inRandomOrder()->take(10)->get()->each(function (User $user) use ($actions) {
            foreach (range(1, rand(1, 4)) as $i) {
                $action = $actions[array_rand($actions)];

                UserPoint::create([
                    'user_id' => $user->id,
                    'action' => $action,
                    'points' => fake()->numberBetween(5, 100),
                    'metadata' => ['note' => "Awarded for {$action}"],
                ]);
            }
        });
    }
}
