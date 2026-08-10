<?php

namespace Tests\Feature\Catalog;

use App\Models\Account\User;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Restaurant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RestaurantTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'traveler', 'guard_name' => 'api']);
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'api']);
        Permission::create(['name' => 'manage restaurants', 'guard_name' => 'api']);
        $adminRole->syncPermissions(['manage restaurants']);
    }

    public function test_admin_can_list_restaurants(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Restaurant::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/restaurants');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_can_create_restaurant(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $destination = Destination::factory()->create();

        $response = $this->actingAs($admin, 'api')->postJson('/api/v1/admin/restaurants', [
            'name' => 'Nile Bistro',
            'cuisine' => 'Egyptian',
            'rating' => 5,
            'destination_id' => $destination->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Nile Bistro');

        $this->assertDatabaseHas('restaurants', [
            'name' => 'Nile Bistro',
            'destination_id' => $destination->id,
        ]);
    }

    public function test_admin_can_update_restaurant(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $restaurant = Restaurant::factory()->create(['name' => 'Old Grill']);

        $response = $this->actingAs($admin, 'api')->putJson("/api/v1/admin/restaurants/{$restaurant->id}", [
            'name' => 'New Grill',
            'cuisine' => 'Grill',
            'rating' => 4,
            'destination_id' => $restaurant->destination_id,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'New Grill');

        $this->assertDatabaseHas('restaurants', [
            'id' => $restaurant->id,
            'name' => 'New Grill',
        ]);
    }

    public function test_admin_can_delete_restaurant(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $restaurant = Restaurant::factory()->create();

        $this->actingAs($admin, 'api')->deleteJson("/api/v1/admin/restaurants/{$restaurant->id}")
            ->assertStatus(200);

        $this->assertSoftDeleted('restaurants', ['id' => $restaurant->id]);
    }

    public function test_restaurant_creation_without_destination_returns_422(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin, 'api')->postJson('/api/v1/admin/restaurants', [
            'name' => 'No Destination',
            'cuisine' => 'X',
            'rating' => 3,
        ])->assertStatus(422)
            ->assertJsonStructure(['error' => ['type', 'status', 'message', 'timestamp']]);
    }

    public function test_traveler_cannot_access_admin_restaurants(): void
    {
        $user = User::factory()->create();
        $user->assignRole('traveler');

        $this->actingAs($user, 'api')->getJson('/api/v1/admin/restaurants')->assertStatus(403);
    }
}
