<?php

namespace Tests\Feature;

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

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        return $admin;
    }

    private function traveler(): User
    {
        $user = User::factory()->create();
        $user->assignRole('traveler');

        return $user;
    }

    public function test_guest_can_list_categories(): void
    {
        Category::factory()->count(3)->create(['name' => 'Museums']);

        $response = $this->getJson('/api/v1/categories');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.name', 'Museums');
    }

    public function test_guest_can_show_single_category(): void
    {
        $category = Category::factory()->create(['name' => 'Beaches']);

        $this->getJson("/api/v1/categories/{$category->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Beaches');
    }

    public function test_admin_can_store_category(): void
    {
        $response = $this->actingAs($this->admin(), 'api')
            ->postJson('/api/v1/admin/categories', [
                'name' => 'Nightlife',
                'type' => 'attraction',
            ]);

        // JsonResource returned from a POST route → 201 (ResourceResponse behavior)
        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Nightlife');

        $this->assertDatabaseHas('categories', ['name' => 'Nightlife', 'type' => 'attraction']);
    }

    public function test_admin_can_update_category(): void
    {
        $category = Category::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($this->admin(), 'api')
            ->putJson("/api/v1/admin/categories/{$category->id}", [
                'name' => 'New Name',
                'type' => 'restaurant',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'New Name');

        $this->assertDatabaseHas('categories', ['id' => $category->id, 'name' => 'New Name']);
    }

    public function test_admin_can_destroy_category(): void
    {
        $category = Category::factory()->create();

        $response = $this->actingAs($this->admin(), 'api')
            ->deleteJson("/api/v1/admin/categories/{$category->id}");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Category deleted successfully');

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_admin_store_category_validation_fails_with_422(): void
    {
        $this->actingAs($this->admin(), 'api')
            ->postJson('/api/v1/admin/categories', ['name' => ''])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_traveler_cannot_access_admin_category_endpoints(): void
    {
        $category = Category::factory()->create();

        $this->actingAs($this->traveler(), 'api')
            ->postJson('/api/v1/admin/categories', ['name' => 'X', 'type' => 'hotel'])
            ->assertStatus(403);

        $this->actingAs($this->traveler(), 'api')
            ->putJson("/api/v1/admin/categories/{$category->id}", ['name' => 'Y', 'type' => 'hotel'])
            ->assertStatus(403);

        $this->actingAs($this->traveler(), 'api')
            ->deleteJson("/api/v1/admin/categories/{$category->id}")
            ->assertStatus(403);
    }
}