<?php

namespace Tests\Feature\Commerce;

use App\Enums\AgencyAssignmentStatus;
use App\Models\Account\User;
use App\Models\Catalog\Hotel;
use App\Models\Commerce\AgencyAssignment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AgencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    }

    public function test_customer_can_request_agency()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')->postJson('/api/agency-requests', [
            'budget_level' => 'high',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('agency_assignments', [
            'customer_id' => $user->id,
            'budget_level' => 'high',
            'status' => 'requested',
        ]);
    }

    public function test_admin_can_approve_assignment()
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findByName('admin', 'api'));
        $agencyUser = User::factory()->create();
        $customer = User::factory()->create();
        $assignment = AgencyAssignment::factory()->create([
            'customer_id' => $customer->id,
            'status' => AgencyAssignmentStatus::REQUESTED,
        ]);

        $response = $this->actingAs($admin, 'api')->postJson(
            "/api/admin/agency-requests/{$assignment->id}/approve",
            ['agency_user_id' => $agencyUser->id]
        );

        $response->assertOk();
        $this->assertDatabaseHas('agency_assignments', [
            'id' => $assignment->id,
            'status' => 'admin_approved',
            'admin_id' => $admin->id,
            'agency_user_id' => $agencyUser->id,
        ]);
    }

    public function test_non_admin_cannot_approve_assignment()
    {
        $customer = User::factory()->create();
        $assignment = AgencyAssignment::factory()->create([
            'customer_id' => $customer->id,
            'status' => AgencyAssignmentStatus::REQUESTED,
        ]);

        $response = $this->actingAs($customer, 'api')->postJson(
            "/api/admin/agency-requests/{$assignment->id}/approve",
            ['agency_user_id' => User::factory()->create()->id]
        );

        $response->assertForbidden();
        $this->assertDatabaseHas('agency_assignments', [
            'id' => $assignment->id,
            'status' => 'requested',
        ]);
    }

    public function test_agency_can_approve_assignment()
    {
        $agencyUser = User::factory()->create();
        $agencyUser->assignRole(Role::findByName('agency', 'api'));
        $assignment = AgencyAssignment::factory()->create([
            'agency_user_id' => $agencyUser->id,
            'status' => AgencyAssignmentStatus::ADMIN_APPROVED,
        ]);

        $response = $this->actingAs($agencyUser, 'api')->postJson(
            "/api/agency/assignments/{$assignment->id}/approve"
        );

        $response->assertOk();
        $this->assertDatabaseHas('agency_assignments', [
            'id' => $assignment->id,
            'status' => 'agency_approved',
        ]);
    }

    public function test_agency_can_decline_assignment()
    {
        $agencyUser = User::factory()->create();
        $agencyUser->assignRole(Role::findByName('agency', 'api'));
        $assignment = AgencyAssignment::factory()->create([
            'agency_user_id' => $agencyUser->id,
            'status' => AgencyAssignmentStatus::ADMIN_APPROVED,
        ]);

        $response = $this->actingAs($agencyUser, 'api')->postJson(
            "/api/agency/assignments/{$assignment->id}/decline"
        );

        $response->assertOk();
        $this->assertDatabaseHas('agency_assignments', [
            'id' => $assignment->id,
            'status' => 'agency_declined',
        ]);
    }

    public function test_agency_cannot_respond_to_unassigned_assignment()
    {
        $agencyUser = User::factory()->create();
        $agencyUser->assignRole(Role::findByName('agency', 'api'));
        $otherAgency = User::factory()->create();
        $assignment = AgencyAssignment::factory()->create([
            'agency_user_id' => $otherAgency->id,
            'status' => AgencyAssignmentStatus::ADMIN_APPROVED,
        ]);

        $response = $this->actingAs($agencyUser, 'api')->postJson(
            "/api/agency/assignments/{$assignment->id}/approve"
        );

        $response->assertForbidden();
        $this->assertDatabaseHas('agency_assignments', [
            'id' => $assignment->id,
            'status' => 'admin_approved',
        ]);
    }

    public function test_agency_can_list_own_assignments()
    {
        $agencyUser = User::factory()->create();
        $agencyUser->assignRole(Role::findByName('agency', 'api'));
        AgencyAssignment::factory()->create([
            'agency_user_id' => $agencyUser->id,
            'status' => AgencyAssignmentStatus::ADMIN_APPROVED,
        ]);

        $response = $this->actingAs($agencyUser, 'api')->getJson('/api/agency/assignments');

        $response->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_agency_can_build_trip_for_customer()
    {
        $agencyUser = User::factory()->create();
        $agencyUser->assignRole(Role::findByName('agency', 'api'));
        $customer = User::factory()->create();
        $assignment = AgencyAssignment::factory()->create([
            'customer_id' => $customer->id,
            'agency_user_id' => $agencyUser->id,
            'status' => AgencyAssignmentStatus::AGENCY_APPROVED,
        ]);
        $hotel = Hotel::factory()->create();

        $response = $this->actingAs($agencyUser, 'api')->postJson(
            "/api/agency/assignments/{$assignment->id}/trips",
            [
                'title' => 'Cairo Luxury Week',
                'items' => [['type' => Hotel::class, 'id' => $hotel->id]],
            ]
        );

        $response->assertCreated();
        $this->assertDatabaseHas('trips', [
            'user_id' => $customer->id,
            'agency_assignment_id' => $assignment->id,
            'title' => 'Cairo Luxury Week',
        ]);
        $this->assertDatabaseHas('trip_items', [
            'item_type' => 'hotel',
            'item_id' => $hotel->id,
        ]);
    }

    private function approvedAssignment(User $agency): AgencyAssignment
    {
        return AgencyAssignment::factory()->create([
            'customer_id' => User::factory()->create()->id,
            'agency_user_id' => $agency->id,
            'status' => AgencyAssignmentStatus::AGENCY_APPROVED,
        ]);
    }

    public function test_customer_can_report_assignment()
    {
        $agency = User::factory()->create();
        $agency->assignRole(Role::findByName('agency', 'api'));
        $assignment = $this->approvedAssignment($agency);

        $response = $this->actingAs(User::find($assignment->customer_id), 'api')->postJson(
            "/api/agency-assignments/{$assignment->id}/report",
            ['reason' => 'Overcharged on trip build', 'details' => 'Quoted $2,000, billed $3,000.']
        );

        $response->assertStatus(201);
        $this->assertDatabaseHas('flags', [
            'reporter_id' => $assignment->customer_id,
            'agency_assignment_id' => $assignment->id,
            'flaggable_type' => 'user',
            'flaggable_id' => $agency->id,
            'reason' => 'Overcharged on trip build',
            'status' => 'pending',
        ]);
    }

    public function test_non_customer_cannot_report_assignment()
    {
        $agency = User::factory()->create();
        $agency->assignRole(Role::findByName('agency', 'api'));
        $assignment = $this->approvedAssignment($agency);
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger, 'api')->postJson(
            "/api/agency-assignments/{$assignment->id}/report",
            ['reason' => 'Not my assignment']
        );

        $response->assertForbidden();
        $this->assertDatabaseCount('flags', 0);
    }

    public function test_customer_cannot_report_unapproved_assignment()
    {
        $customer = User::factory()->create();
        $assignment = AgencyAssignment::factory()->create([
            'customer_id' => $customer->id,
            'status' => AgencyAssignmentStatus::REQUESTED,
        ]);

        $response = $this->actingAs($customer, 'api')->postJson(
            "/api/agency-assignments/{$assignment->id}/report",
            ['reason' => 'Too early']
        );

        $response->assertForbidden();
        $this->assertDatabaseCount('flags', 0);
    }

    public function test_admin_can_list_and_approve_flags()
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findByName('admin', 'api'));
        $agency = User::factory()->create();
        $agency->assignRole(Role::findByName('agency', 'api'));
        $assignment = $this->approvedAssignment($agency);

        $report = $this->actingAs(User::find($assignment->customer_id), 'api')->postJson(
            "/api/agency-assignments/{$assignment->id}/report",
            ['reason' => 'Misleading itinerary']
        );
        $report->assertStatus(201);
        $flagId = $report->json('data.id');

        $list = $this->actingAs($admin, 'api')->getJson('/api/admin/flags');
        $list->assertOk()->assertJsonCount(1, 'data');

        $approve = $this->actingAs($admin, 'api')->postJson("/api/admin/flags/{$flagId}/approve");
        $approve->assertOk();
        $this->assertDatabaseHas('flags', [
            'id' => $flagId,
            'status' => 'approved',
            'reviewed_by' => $admin->id,
        ]);
    }

    public function test_admin_can_decline_flag()
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findByName('admin', 'api'));
        $agency = User::factory()->create();
        $agency->assignRole(Role::findByName('agency', 'api'));
        $assignment = $this->approvedAssignment($agency);

        $report = $this->actingAs(User::find($assignment->customer_id), 'api')->postJson(
            "/api/agency-assignments/{$assignment->id}/report",
            ['reason' => 'Minor dispute']
        );
        $report->assertStatus(201);
        $flagId = $report->json('data.id');

        $decline = $this->actingAs($admin, 'api')->postJson("/api/admin/flags/{$flagId}/decline");
        $decline->assertOk();
        $this->assertDatabaseHas('flags', [
            'id' => $flagId,
            'status' => 'declined',
            'reviewed_by' => $admin->id,
        ]);
        $this->assertDatabaseHas('agency_assignments', [
            'id' => $assignment->id,
            'status' => 'agency_approved',
        ]);
    }

    public function test_non_admin_cannot_review_flags()
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findByName('admin', 'api'));
        $agency = User::factory()->create();
        $agency->assignRole(Role::findByName('agency', 'api'));
        $assignment = $this->approvedAssignment($agency);

        $report = $this->actingAs(User::find($assignment->customer_id), 'api')->postJson(
            "/api/agency-assignments/{$assignment->id}/report",
            ['reason' => 'Anything']
        );
        $report->assertStatus(201);
        $flagId = $report->json('data.id');

        $this->actingAs($agency, 'api')->getJson('/api/admin/flags')->assertForbidden();
        $this->actingAs($agency, 'api')->postJson("/api/admin/flags/{$flagId}/approve")->assertForbidden();
    }
}
