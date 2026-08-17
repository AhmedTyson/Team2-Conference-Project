<?php

namespace Database\Seeders;

use App\Enums\AgencyAssignmentStatus;
use App\Models\Account\User;
use App\Models\Commerce\AgencyAssignment;
use App\Models\Trips\Trip;
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
        if (! $agency->hasRole('agency')) {
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
            $assignment = AgencyAssignment::firstOrCreate(
                ['customer_id' => $customer->id, 'budget_level' => ['medium', 'high', 'luxury'][$index % 3]],
                [
                    'agency_user_id' => $agency->id,
                    'status' => $statuses[$index % count($statuses)],
                    'admin_approved_at' => now()->subDays(12 - $index),
                    'agency_responded_at' => now()->subDays(11 - $index),
                ]
            );

            // Create sample trip proposal for approved and completed assignments
            if (in_array($assignment->status, [AgencyAssignmentStatus::AGENCY_APPROVED, AgencyAssignmentStatus::COMPLETED])) {
                Trip::firstOrCreate(
                    [
                        'agency_assignment_id' => $assignment->id,
                    ],
                    [
                        'user_id' => $customer->id,
                        'title' => ['Luxury Red Sea Resort Escape', 'Cairo & Luxor Nile Expedition', 'Pyramids & Culinary Heritage Tour', 'Alexandria Coastal VIP Retreat'][$index % 4],
                        'travel_style' => 'luxury',
                        'interests' => ['culture', 'resort', 'history'],
                        'no_of_days' => 7,
                        'status' => 'planned',
                        'is_public' => true,
                        'budget' => [4500.00, 7200.00, 3100.00, 8900.00][$index % 4],
                        'no_of_travelers' => 2,
                        'start_date' => now()->addDays(15 + $index),
                        'end_date' => now()->addDays(22 + $index),
                    ]
                );
            }
        }
    }
}
