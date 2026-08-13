<?php

namespace Tests\Feature\Catalog;

use App\Models\Account\User;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Hotel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class HotelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'traveler', 'guard_name' => 'api']);
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'api']);
        Permission::create(['name' => 'manage hotels', 'guard_name' => 'api']);
        $adminRole->syncPermissions(['manage hotels']);
    }

    public function test_admin_can_list_hotels(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Hotel::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/hotels');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_can_create_hotel(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $destination = Destination::factory()->create();

        $response = $this->actingAs($admin, 'api')->postJson('/api/v1/admin/hotels', [
            'name' => 'Palm Resort',
            'stars' => 5,
            'price_per_night' => 12000,
            'availability' => '1',
            'destination_id' => $destination->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Palm Resort');

        $this->assertDatabaseHas('hotels', [
            'id' => $response->json('data.id'),
            'name' => 'Palm Resort',
            'destination_id' => $destination->id,
        ]);
    }

    public function test_admin_can_update_hotel(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $hotel = Hotel::factory()->create(['name' => 'Old Inn']);

        $response = $this->actingAs($admin, 'api')->putJson("/api/v1/admin/hotels/{$hotel->id}", [
            'name' => 'New Inn',
            'stars' => 4,
            'price_per_night' => 9000,
            'availability' => '1',
            'destination_id' => $hotel->destination_id,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'New Inn');

        $this->assertDatabaseHas('hotels', [
            'id' => $hotel->id,
            'name' => 'New Inn',
        ]);
    }

    public function test_admin_can_delete_hotel(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $hotel = Hotel::factory()->create();

        $response = $this->actingAs($admin, 'api')->deleteJson("/api/v1/admin/hotels/{$hotel->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('hotels', ['id' => $hotel->id]);
    }

    public function test_hotel_creation_validation_returns_error_contract(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin, 'api')->postJson('/api/v1/admin/hotels', ['name' => 'X']);

        $response->assertStatus(422)
            ->assertJsonStructure(['error' => ['type', 'status', 'message', 'timestamp']]);
    }

    public function test_traveler_cannot_access_admin_hotels(): void
    {
        $user = User::factory()->create();
        $user->assignRole('traveler');

        $this->actingAs($user, 'api')->getJson('/api/v1/admin/hotels')->assertStatus(403);
        $this->actingAs($user, 'api')->postJson('/api/v1/admin/hotels', [
            'name' => 'Hacked',
            'stars' => 5,
            'price_per_night' => 1,
            'availability' => '1',
            'destination_id' => 1,
        ])->assertStatus(403);
    }

    public function test_hotel_creation_validation_rejects_invalid_types(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $payload = [
            'name' => '',
            'stars' => 10,
            'price_per_night' => -50,
            'availability' => 'yes',
            'rating' => 6,
            'destination_id' => 99999,
        ];

        $response = $this->actingAs($admin, 'api')->postJson('/api/v1/admin/hotels', $payload);

        $response->assertStatus(422);

        $errorFields = collect($response->json('error.validation_errors'))->pluck('field')->toArray();
        $this->assertContains('name', $errorFields);
        $this->assertContains('stars', $errorFields);
        $this->assertContains('price_per_night', $errorFields);
        $this->assertContains('availability', $errorFields);
        $this->assertContains('destination_id', $errorFields);
    }
}
