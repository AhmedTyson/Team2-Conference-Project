<?php

namespace Tests\Feature\Admin;

use App\Models\Attraction;
use App\Models\Category;
use App\Models\Destination;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class HotelRestaurantAttractionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'traveler', 'guard_name' => 'api']);
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'api']);

        foreach (['manage hotels', 'manage restaurants', 'manage attractions'] as $permission) {
            Permission::create(['name' => $permission, 'guard_name' => 'api']);
        }
        $adminRole->syncPermissions(['manage hotels', 'manage restaurants', 'manage attractions']);
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

    // ------------------------------------------------------------------ HOTELS

    public function test_admin_can_list_hotels_paginated(): void
    {
        Hotel::factory()->count(11)->create();

        $response = $this->actingAs($this->admin(), 'api')->getJson('/api/v1/admin/hotels');

        $response->assertStatus(200)
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.total', 11);
    }

    public function test_admin_can_create_hotel(): void
    {
        $destination = Destination::factory()->create();

        $response = $this->actingAs($this->admin(), 'api')
            ->postJson('/api/v1/admin/hotels', [
                'destination_id' => $destination->id,
                'name' => 'Seaside Resort',
                'address' => '123 Ocean Drive',
                'price_per_night' => 120.50,
                'rating' => 4.5,
                'stars' => 4,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Seaside Resort');

        $this->assertDatabaseHas('hotels', [
            'destination_id' => $destination->id,
            'name' => 'Seaside Resort',
        ]);
    }

    public function test_admin_create_hotel_validation_fails_with_422(): void
    {
        $this->actingAs($this->admin(), 'api')
            ->postJson('/api/v1/admin/hotels', ['name' => 'Missing Destination'])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_update_hotel(): void
    {
        $destination = Destination::factory()->create();
        $hotel = Hotel::factory()->create(['destination_id' => $destination->id, 'name' => 'Old Hotel']);

        $response = $this->actingAs($this->admin(), 'api')
            ->putJson("/api/v1/admin/hotels/{$hotel->id}", [
                'destination_id' => $destination->id,
                'name' => 'Renovated Hotel',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Renovated Hotel');

        $this->assertDatabaseHas('hotels', ['id' => $hotel->id, 'name' => 'Renovated Hotel']);
    }

    public function test_admin_can_destroy_hotel(): void
    {
        $hotel = Hotel::factory()->create();

        $response = $this->actingAs($this->admin(), 'api')
            ->deleteJson("/api/v1/admin/hotels/{$hotel->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Hotel deleted successfully');

        $this->assertDatabaseMissing('hotels', ['id' => $hotel->id]);
    }

    public function test_traveler_cannot_manage_hotels(): void
    {
        $this->actingAs($this->traveler(), 'api')->getJson('/api/v1/admin/hotels')->assertStatus(403);
        $this->actingAs($this->traveler(), 'api')
            ->postJson('/api/v1/admin/hotels', ['name' => 'x', 'destination_id' => 1])
            ->assertStatus(403);
    }

    // ------------------------------------------------------------------ RESTAURANTS

    public function test_admin_can_list_restaurants(): void
    {
        Restaurant::factory()->count(3)->create();

        $response = $this->actingAs($this->admin(), 'api')->getJson('/api/v1/admin/restaurants');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_can_create_restaurant(): void
    {
        $destination = Destination::factory()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($this->admin(), 'api')
            ->postJson('/api/v1/admin/restaurants', [
                'destination_id' => $destination->id,
                'category_id' => $category->id,
                'name' => 'El Fuego',
                'cuisine' => 'Mexican',
                'price_range' => '$$',
                'rating' => 4.7,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Restaurant created successfully.')
            ->assertJsonPath('data.name', 'El Fuego');

        $this->assertDatabaseHas('restaurants', [
            'destination_id' => $destination->id,
            'name' => 'El Fuego',
        ]);
    }

    public function test_admin_create_restaurant_validation_fails_with_422(): void
    {
        $this->actingAs($this->admin(), 'api')
            ->postJson('/api/v1/admin/restaurants', ['name' => 'No Destination'])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_update_restaurant(): void
    {
        $destination = Destination::factory()->create();
        $restaurant = Restaurant::factory()->create(['destination_id' => $destination->id, 'name' => 'Old Eatery']);

        $response = $this->actingAs($this->admin(), 'api')
            ->putJson("/api/v1/admin/restaurants/{$restaurant->id}", [
                'destination_id' => $destination->id,
                'name' => 'New Eatery',
                'cuisine' => 'Italian',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'New Eatery');

        $this->assertDatabaseHas('restaurants', ['id' => $restaurant->id, 'name' => 'New Eatery']);
    }

    public function test_admin_can_destroy_restaurant(): void
    {
        $restaurant = Restaurant::factory()->create();

        $response = $this->actingAs($this->admin(), 'api')
            ->deleteJson("/api/v1/admin/restaurants/{$restaurant->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Restaurant deleted successfully.');

        $this->assertDatabaseMissing('restaurants', ['id' => $restaurant->id]);
    }

    public function test_traveler_cannot_manage_restaurants(): void
    {
        $this->actingAs($this->traveler(), 'api')->getJson('/api/v1/admin/restaurants')->assertStatus(403);
        $this->actingAs($this->traveler(), 'api')
            ->postJson('/api/v1/admin/restaurants', ['name' => 'H', 'destination_id' => 1])
            ->assertStatus(403);
    }

    // ----------------------------------------------------------------- ATTRACTIONS

    public function test_admin_can_list_attractions_paginated(): void
    {
        Attraction::factory()->count(11)->create();

        $response = $this->actingAs($this->admin(), 'api')->getJson('/api/v1/admin/attractions');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(10, 'data');
    }

    public function test_admin_can_create_attraction(): void
    {
        $destination = Destination::factory()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($this->admin(), 'api')
            ->postJson('/api/v1/admin/attractions', [
                'destination_id' => $destination->id,
                'category_id' => $category->id,
                'name' => 'Grand Museum',
                'description' => 'Art and history',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Attraction created successfully')
            ->assertJsonPath('data.name', 'Grand Museum');

        $this->assertDatabaseHas('attractions', ['name' => 'Grand Museum']);
    }

    public function test_admin_create_attraction_validation_fails_with_422(): void
    {
        $this->actingAs($this->admin(), 'api')
            ->postJson('/api/v1/admin/attractions', ['name' => 'No Relations'])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_update_attraction(): void
    {
        $destination = Destination::factory()->create();
        $category = Category::factory()->create();
        $attraction = Attraction::factory()->create(['name' => 'Old Attraction']);

        $response = $this->actingAs($this->admin(), 'api')
            ->putJson("/api/v1/admin/attractions/{$attraction->id}", [
                'destination_id' => $destination->id,
                'category_id' => $category->id,
                'name' => 'Updated Attraction',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Updated Attraction');

        $this->assertDatabaseHas('attractions', ['id' => $attraction->id, 'name' => 'Updated Attraction']);
    }

    public function test_admin_can_destroy_attraction(): void
    {
        $attraction = Attraction::factory()->create();

        $response = $this->actingAs($this->admin(), 'api')
            ->deleteJson("/api/v1/admin/attractions/{$attraction->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Attraction deleted successfully');

        $this->assertDatabaseMissing('attractions', ['id' => $attraction->id]);
    }

    public function test_traveler_cannot_manage_attractions(): void
    {
        $this->actingAs($this->traveler(), 'api')->getJson('/api/v1/admin/attractions')->assertStatus(403);
        $this->actingAs($this->traveler(), 'api')
            ->postJson('/api/v1/admin/attractions', ['name' => 'H', 'destination_id' => 1, 'category_id' => 1])
            ->assertStatus(403);
    }
}