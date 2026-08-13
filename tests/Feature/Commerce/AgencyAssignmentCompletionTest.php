<?php

namespace Tests\Feature\Commerce;

use App\Enums\AgencyAssignmentStatus;
use App\Models\Account\User;
use App\Models\Commerce\AgencyAssignment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AgencyAssignmentCompletionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'super_admin', 'agency'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'api']);
        }
    }

    public function test_admin_can_list_pending_agency_requests(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $pending = AgencyAssignment::factory()->create(['status' => AgencyAssignmentStatus::REQUESTED]);
        AgencyAssignment::factory()->create(['status' => AgencyAssignmentStatus::ADMIN_APPROVED]);
        AgencyAssignment::factory()->create(['status' => AgencyAssignmentStatus::AGENCY_APPROVED]);

        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/agency-requests');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $pending->id)
            ->assertJsonPath('data.0.status', 'requested');
    }

    public function test_non_admin_cannot_list_pending_agency_requests(): void
    {
        $agency = User::factory()->create();
        $agency->assignRole('agency');

        $this->actingAs($agency, 'api')->getJson('/api/v1/admin/agency-requests')->assertForbidden();
    }

    public function test_customer_can_view_own_agency_assignments(): void
    {
        $customer = User::factory()->create();
        AgencyAssignment::factory()->create([
            'customer_id' => $customer->id,
            'status' => AgencyAssignmentStatus::REQUESTED,
        ]);
        AgencyAssignment::factory()->create([
            'customer_id' => $customer->id,
            'status' => AgencyAssignmentStatus::AGENCY_APPROVED,
        ]);

        $response = $this->actingAs($customer, 'api')->getJson('/api/v1/agency-assignments');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_customer_cannot_see_other_customers_assignments(): void
    {
        $customer = User::factory()->create();
        $other = User::factory()->create();
        AgencyAssignment::factory()->create([
            'customer_id' => $other->id,
            'status' => AgencyAssignmentStatus::REQUESTED,
        ]);

        $response = $this->actingAs($customer, 'api')->getJson('/api/v1/agency-assignments');

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_customer_can_cancel_requested_assignment(): void
    {
        $customer = User::factory()->create();
        $assignment = AgencyAssignment::factory()->create([
            'customer_id' => $customer->id,
            'status' => AgencyAssignmentStatus::REQUESTED,
        ]);

        $response = $this->actingAs($customer, 'api')->postJson(
            "/api/v1/agency-assignments/{$assignment->id}/cancel"
        );

        $response->assertOk();

        $this->assertDatabaseHas('agency_assignments', [
            'id' => $assignment->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_customer_can_cancel_admin_approved_assignment(): void
    {
        $customer = User::factory()->create();
        $assignment = AgencyAssignment::factory()->create([
            'customer_id' => $customer->id,
            'status' => AgencyAssignmentStatus::ADMIN_APPROVED,
        ]);

        $this->actingAs($customer, 'api')->postJson(
            "/api/v1/agency-assignments/{$assignment->id}/cancel"
        )->assertOk();

        $this->assertDatabaseHas('agency_assignments', [
            'id' => $assignment->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_customer_cannot_cancel_agency_approved_assignment(): void
    {
        $customer = User::factory()->create();
        $assignment = AgencyAssignment::factory()->create([
            'customer_id' => $customer->id,
            'status' => AgencyAssignmentStatus::AGENCY_APPROVED,
        ]);

        $this->actingAs($customer, 'api')->postJson(
            "/api/v1/agency-assignments/{$assignment->id}/cancel"
        )->assertStatus(409);

        $this->assertDatabaseHas('agency_assignments', [
            'id' => $assignment->id,
            'status' => 'agency_approved',
        ]);
    }

    public function test_customer_cannot_cancel_already_cancelled_assignment(): void
    {
        $customer = User::factory()->create();
        $assignment = AgencyAssignment::factory()->create([
            'customer_id' => $customer->id,
            'status' => AgencyAssignmentStatus::CANCELLED,
        ]);

        $this->actingAs($customer, 'api')->postJson(
            "/api/v1/agency-assignments/{$assignment->id}/cancel"
        )->assertStatus(409);
    }

    public function test_non_owner_cannot_cancel_assignment(): void
    {
        $customer = User::factory()->create();
        $intruder = User::factory()->create();
        $assignment = AgencyAssignment::factory()->create([
            'customer_id' => $customer->id,
            'status' => AgencyAssignmentStatus::REQUESTED,
        ]);

        $this->actingAs($intruder, 'api')->postJson(
            "/api/v1/agency-assignments/{$assignment->id}/cancel"
        )->assertForbidden();

        $this->assertDatabaseHas('agency_assignments', [
            'id' => $assignment->id,
            'status' => 'requested',
        ]);
    }
}
