<?php

namespace Tests\Feature\Commerce;

use App\Enums\AgencyAssignmentStatus;
use App\Models\Account\Role;
use App\Models\Account\User;
use App\Models\Commerce\AgencyAssignment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgencyAssignmentStateTransitionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'agency', 'guard_name' => 'api']);
    }

    public function test_admin_cannot_approve_already_approved_assignment()
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findByName('admin', 'api'));

        $agency = User::factory()->create();

        $assignment = AgencyAssignment::factory()->create([
            'status' => AgencyAssignmentStatus::ADMIN_APPROVED,
        ]);

        $response = $this->actingAs($admin, 'api')->postJson("/api/v1/admin/agency-requests/{$assignment->id}/approve", [
            'agency_user_id' => $agency->id,
        ]);

        $response->assertStatus(409);
    }

    public function test_agency_cannot_approve_unassigned_assignment()
    {
        $agency = User::factory()->create();
        $agency->assignRole(Role::findByName('agency', 'api'));

        $assignment = AgencyAssignment::factory()->create([
            'status' => AgencyAssignmentStatus::REQUESTED,
            'agency_user_id' => $agency->id,
        ]);

        $response = $this->actingAs($agency, 'api')->postJson("/api/v1/agency/assignments/{$assignment->id}/approve");

        $response->assertStatus(409);
    }

    public function test_agency_cannot_decline_unassigned_assignment()
    {
        $agency = User::factory()->create();
        $agency->assignRole(Role::findByName('agency', 'api'));

        $assignment = AgencyAssignment::factory()->create([
            'status' => AgencyAssignmentStatus::REQUESTED,
            'agency_user_id' => $agency->id,
        ]);

        $response = $this->actingAs($agency, 'api')->postJson("/api/v1/agency/assignments/{$assignment->id}/decline");

        $response->assertStatus(409);
    }

    public function test_agency_cannot_build_trip_before_approving()
    {
        $agency = User::factory()->create();
        $agency->assignRole(Role::findByName('agency', 'api'));

        $assignment = AgencyAssignment::factory()->create([
            'status' => AgencyAssignmentStatus::ADMIN_APPROVED,
            'agency_user_id' => $agency->id,
        ]);

        $response = $this->actingAs($agency, 'api')->postJson("/api/v1/agency/assignments/{$assignment->id}/trips", [
            'title' => 'Test',
            'items' => [],
        ]);

        $response->assertStatus(409);
    }
}
