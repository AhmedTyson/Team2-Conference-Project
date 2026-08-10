<?php

namespace Database\Seeders;

use App\Models\Account\User;
use App\Models\Catalog\EntityView;
use App\Models\Catalog\Experience;
use Illuminate\Database\Seeder;

class EntityViewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::inRandomOrder()->take(10)->get();
        $experiences = Experience::all();

        if ($experiences->isEmpty()) {
            $this->command?->warn('Skipping EntityViewSeeder: no experiences found.');

            return;
        }

        foreach (range(1, 30) as $i) {
            EntityView::create([
                'viewable_type' => Experience::class,
                'viewable_id' => $experiences->random()->id,
                'user_id' => fake()->boolean(70) ? $users->random()->id : null,
                'ip' => fake()->ipv4(),
            ]);
        }
    }
}
