<?php

namespace Tests\Feature\Account;

use App\Models\Account\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'traveler', 'guard_name' => 'api']);
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'api']);

        Permission::create(['name' => 'manage users', 'guard_name' => 'api']);
        $adminRole->syncPermissions(['manage users']);
    }

    /**
     * FIXED by CoLeader merge: AdminUserController::index returns
     * `UserResource::collection($users)` — proper collection response.
     */
    public function test_admin_list_users_returns_200_with_collection(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        User::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/users');

        $response->assertStatus(200);
        $response->assertJsonCount(4, 'data');
    }

    /**
     * FIXED by CoLeader merge: AdminUserController::store returns the
     * created user resource with a 201 status.
     */
    public function test_admin_can_store_user_with_created_resource(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin, 'api')
            ->postJson('/api/v1/admin/users', [
                'name' => 'New Admin User',
                'email' => 'newuser@example.com',
                'password' => 'secret123',
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.email', 'newuser@example.com');

        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
            'name' => 'New Admin User',
        ]);
    }

    /**
     * FIXED by Phase 1: AdminUserController::store now uses StoreUserRequest,
     * so an invalid payload yields a 422 instead of the previous 500.
     */
    public function test_admin_store_user_without_validation_returns_422(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin, 'api')
            ->postJson('/api/v1/admin/users', ['email' => 'missing-fields@example.com']);

        $response->assertStatus(422);
        $response->assertJsonStructure(['error' => ['type', 'status', 'message', 'timestamp']]);
    }

    public function test_traveler_cannot_list_or_create_users(): void
    {
        $user = User::factory()->create();
        $user->assignRole('traveler');

        $this->actingAs($user, 'api')->getJson('/api/v1/admin/users')->assertStatus(403);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/admin/users', [
                'name' => 'Hacker',
                'email' => 'hacker@example.com',
                'password' => 'secret123',
            ])
            ->assertStatus(403);
    }
}
