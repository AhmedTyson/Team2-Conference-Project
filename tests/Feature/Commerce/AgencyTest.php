<?php

namespace Tests\Feature\Commerce;

use App\Models\Account\User;
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
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'agency', 'guard_name' => 'api']);
    }

    public function test_customer_can_request_agency()
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user, 'api')->postJson('/api/v1/agency-requests', [
            'budget_level' => 'high'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('agency_assignments', [
            'customer_id' => $user->id,
            'budget_level' => 'high',
            'status' => 'requested'
        ]);
    }
}
