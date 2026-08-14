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
            ['email' => 'agency@itinari.com'],
            [
                'name' => 'Nile Horizon Luxury Travel Agency',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );
        if (!$agency->hasRole('agency')) {
            $agency->assignRole('agency');
        }

        $customers = User::role('user')->limit(5)->get();
        if ($customers->isEmpty()) {
            $customers = User::limit(5)->get();
        }

        $statuses = [
            AgencyAssignmentStatus::REQUESTED,
            AgencyAssignmentStatus::ADMIN_APPROVED,
            AgencyAssignmentStatus::AGENCY_APPROVED,
            AgencyAssignmentStatus::COMPLETED,
            AgencyAssignmentStatus::CANCELLED,
        ];

        foreach ($customers as $index => $customer) {
            AgencyAssignment::firstOrCreate(
                ['customer_id' => $customer->id, 'budget_level' => ['medium', 'high', 'luxury'][$index % 3]],
                [
                    'agency_user_id' => $agency->id,
                    'status' => $statuses[$index % count($statuses)],
                    'admin_approved_at' => now()->subDays(10 - $index),
                    'agency_responded_at' => now()->subDays(9 - $index),
                ]
            );
        }
    }
}
