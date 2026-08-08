<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'traveler', 'guard_name' => 'api']);
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'api']);

        Permission::create(['name' => 'manage categories', 'guard_name' => 'api']);
        $adminRole->syncPermissions(['manage categories']);
    }

    public function test_admin_can_list_categories(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Category::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/categories');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_can_create_category(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin, 'api')->postJson('/api/v1/admin/categories', [
            'name' => 'Beach',
            'type' => 'destination',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Beach');

        $this->assertDatabaseHas('categories', [
            'name' => 'Beach',
            'type' => 'destination',
        ]);
    }

    public function test_admin_create_category_without_validation_returns_422(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin, 'api')->postJson('/api/v1/admin/categories', [
            'type' => 'destination',
        ]);

        $response->assertStatus(422);
        $response->assertJsonStructure(['error' => ['type', 'status', 'message', 'timestamp']]);
    }

    public function test_admin_can_update_category(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $category = Category::factory()->create([
            'name' => 'Old Name',
            'type' => 'destination',
        ]);

        $response = $this->actingAs($admin, 'api')->putJson("/api/v1/admin/categories/{$category->id}", [
            'name' => 'New Name',
            'type' => 'hotel',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'New Name');

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'New Name',
            'type' => 'hotel',
        ]);
    }

    public function test_admin_can_delete_category(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $category = Category::factory()->create();

        $response = $this->actingAs($admin, 'api')->deleteJson("/api/v1/admin/categories/{$category->id}");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Category deleted successfully');

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_traveler_cannot_access_admin_categories(): void
    {
        $user = User::factory()->create();
        $user->assignRole('traveler');

        $this->actingAs($user, 'api')->getJson('/api/v1/admin/categories')->assertStatus(403);
        $this->actingAs($user, 'api')->postJson('/api/v1/admin/categories', [
            'name' => 'Hacked',
            'type' => 'destination',
        ])->assertStatus(403);
    }
}
