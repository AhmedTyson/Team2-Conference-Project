<?php

namespace Database\Factories\Commerce;

use App\Enums\AgencyAssignmentStatus;
use App\Models\Account\User;
use App\Models\Commerce\AgencyAssignment;
use Illuminate\Database\Eloquent\Factories\Factory;

class AgencyAssignmentFactory extends Factory
{
    protected $model = AgencyAssignment::class;

    public function definition(): array
    {
        return [
            'customer_id' => User::factory(),
            'budget_level' => fake()->randomElement(['low', 'medium', 'high', 'luxury']),
            'status' => AgencyAssignmentStatus::REQUESTED,
        ];
    }

    public function adminApproved(): static
    {
        return $this->state(fn () => [
            'status' => AgencyAssignmentStatus::ADMIN_APPROVED,
            'admin_id' => User::factory(),
            'agency_user_id' => User::factory(),
            'admin_approved_at' => now(),
        ]);
    }

    public function agencyApproved(): static
    {
        return $this->adminApproved()->state(fn () => [
            'status' => AgencyAssignmentStatus::AGENCY_APPROVED,
            'agency_responded_at' => now(),
        ]);
    }
}
