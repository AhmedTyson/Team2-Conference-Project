<?php

namespace Tests\Feature\Catalog;

use App\Models\Account\User;
use App\Models\Catalog\Attraction;
use App\Models\Catalog\Category;
use App\Models\Catalog\Destination;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AttractionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'traveler', 'guard_name' => 'api']);
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'api']);
        Permission::create(['name' => 'manage attractions', 'guard_name' => 'api']);
        $adminRole->syncPermissions(['manage attractions']);
    }

    public function test_admin_can_list_attractions(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Attraction::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/attractions');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_can_create_attraction(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $destination = Destination::factory()->create();
        $category = Category::factory()->create(['type' => 'attraction']);

        $response = $this->actingAs($admin, 'api')->postJson('/api/v1/admin/attractions', [
            'name' => 'Giza Pyramids',
            'description' => 'Ancient wonder',
            'destination_id' => $destination->id,
            'category_id' => $category->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Giza Pyramids');

        $this->assertDatabaseHas('attractions', [
            'name' => 'Giza Pyramids',
            'destination_id' => $destination->id,
            'category_id' => $category->id,
        ]);
    }

    public function test_admin_can_update_attraction(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $attraction = Attraction::factory()->create(['name' => 'Old Site']);

        $response = $this->actingAs($admin, 'api')->putJson("/api/v1/admin/attractions/{$attraction->id}", [
            'name' => 'New Site',
            'description' => 'Updated description',
            'destination_id' => $attraction->destination_id,
            'category_id' => $attraction->category_id,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'New Site');

        $this->assertDatabaseHas('attractions', [
            'id' => $attraction->id,
            'name' => 'New Site',
        ]);
    }

    public function test_admin_can_delete_attraction(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $attraction = Attraction::factory()->create();

        $this->actingAs($admin, 'api')->deleteJson("/api/v1/admin/attractions/{$attraction->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('attractions', ['id' => $attraction->id]);
    }

    public function test_traveler_cannot_access_admin_attractions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('traveler');

        $this->actingAs($user, 'api')->getJson('/api/v1/admin/attractions')->assertStatus(403);
    }
}
