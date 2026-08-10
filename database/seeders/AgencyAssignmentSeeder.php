<?php

namespace Database\Seeders;

use App\Enums\AgencyAssignmentStatus;
use App\Models\Account\User;
use App\Models\Commerce\AgencyAssignment;
use Illuminate\Database\Seeder;

class AgencyAssignmentSeeder extends Seeder
{
    public function run(): void
    {
        $agency = User::firstOrCreate(
            ['email' => 'agency@itinari.test'],
            [
                'name' => 'Nile Horizon Travel',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );
        $agency->assignRole('agency');

        $customers = User::whereDoesntHave('roles')->limit(2)->get();

        foreach ($customers as $index => $customer) {
            AgencyAssignment::firstOrCreate(
                ['customer_id' => $customer->id, 'status' => AgencyAssignmentStatus::COMPLETED],
                [
                    'agency_user_id' => $agency->id,
                    'budget_level' => ['medium', 'high'][$index % 2],
                    'admin_approved_at' => now()->subDays(10),
                    'agency_responded_at' => now()->subDays(9),
                ]
            );
        }
    }
}
