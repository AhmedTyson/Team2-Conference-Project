<?php

namespace Tests\Feature\Admin;

use App\Models\User;
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
     * KNOWN BUG (documented, not fixed): AdminUserController::index returns
     * `new UserResource(User::all())` — a single resource wrapping a Collection.
     * UserResource accesses `$this->id` on the collection, throwing
     * "Property [id] does not exist on this collection instance" → 500.
     * The endpoint is unusable; it should return a resource collection.
     */
    public function test_admin_list_users_throws_500(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        User::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/users');

        // Assert the ACTUAL implemented behavior: 500 instead of a user list.
        $response->assertStatus(500);
    }

    /**
     * KNOWN BUG (documented, not fixed): AdminUserController::store creates the user
     * but returns nothing, so the client receives an empty 200 response body
     * instead of the created user resource.
     */
    public function test_admin_can_store_user_but_response_is_empty_body(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin, 'api')
            ->postJson('/api/v1/admin/users', [
                'name' => 'New Admin User',
                'email' => 'newuser@example.com',
                'password' => 'secret123',
            ]);

        // Assert the ACTUAL implemented behavior: user persisted, 200, empty body.
        $response->assertStatus(200);
        $this->assertSame('', $response->getContent());

        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
            'name' => 'New Admin User',
        ]);
    }

    /**
     * KNOWN BUG (documented, not fixed): AdminUserController::store has no FormRequest
     * validation, so an invalid payload hits the DB and yields a 500 instead of a 422.
     */
    public function test_admin_store_user_without_validation_returns_500(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin, 'api')
            ->postJson('/api/v1/admin/users', ['email' => 'missing-fields@example.com']);

        $response->assertStatus(500);
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