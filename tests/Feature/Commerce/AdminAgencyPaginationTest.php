<?php

namespace Tests\Feature\Commerce;

use App\Enums\AgencyAssignmentStatus;
use App\Models\Account\User;
use App\Models\Commerce\AgencyAssignment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminAgencyPaginationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_index_returns_paginated_response()
    {
        // Arrange: Create admin role if it doesn't exist
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'api']
        );

        // Create 25 pending assignments
        User::factory()->count(25)->create()->each(function ($user) {
            AgencyAssignment::factory()->create([
                'customer_id' => $user->id,
                'status' => AgencyAssignmentStatus::REQUESTED,
            ]);
        });

        // Act: Get first page
        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/admin/agency-requests');

        // Assert: Check paginated response structure
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'customer_id',
                    'agency_user_id',
                    'status',
                    'created_at',
                ],
            ],
            'pagination' => [
                'total',
                'per_page',
                'current_page',
                'last_page',
                'from',
                'to',
            ],
        ]);

        // Assert: Check pagination values
        $data = $response->json();
        $this->assertCount(15, $data['data']); // Default per_page is 15
        $this->assertEquals(25, $data['pagination']['total']);
        $this->assertEquals(1, $data['pagination']['current_page']);
        $this->assertEquals(2, $data['pagination']['last_page']);
    }

    public function test_admin_index_second_page_returns_correct_data()
    {
        // Arrange: Create admin role if it doesn't exist
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'api']
        );

        // Create 25 pending assignments
        User::factory()->count(25)->create()->each(function ($user) {
            AgencyAssignment::factory()->create([
                'customer_id' => $user->id,
                'status' => AgencyAssignmentStatus::REQUESTED,
            ]);
        });

        // Act: Get second page
        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/admin/agency-requests?page=2');

        // Assert: Check second page has correct data
        $data = $response->json();
        $this->assertCount(10, $data['data']); // 25 - 15 = 10
        $this->assertEquals(2, $data['pagination']['current_page']);
    }

    public function test_admin_index_custom_per_page()
    {
        // Arrange: Create admin role if it doesn't exist
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'api']
        );

        // Create 20 pending assignments
        User::factory()->count(20)->create()->each(function ($user) {
            AgencyAssignment::factory()->create([
                'customer_id' => $user->id,
                'status' => AgencyAssignmentStatus::REQUESTED,
            ]);
        });

        // Act: Request 10 per page
        $response = $this->actingAs($this->adminUser())
            ->getJson('/api/admin/agency-requests?per_page=10');

        // Assert: Check custom per_page
        $data = $response->json();
        $this->assertEquals(10, $data['pagination']['per_page']);
        $this->assertCount(10, $data['data']);
    }

    private function adminUser()
    {
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'api']
        );

        return User::factory()->admin()->create();
    }
}
