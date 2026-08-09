<?php

namespace Tests\Feature\Admin;

use App\Models\Account\User;
use App\Models\Country;
use App\Models\Destination;
use App\Services\Fixtures\OpenStreetService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DestinationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'traveler', 'guard_name' => 'api']);
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'api']);

        Permission::create(['name' => 'manage destinations', 'guard_name' => 'api']);
        $adminRole->syncPermissions(['manage destinations']);
    }

    public function test_admin_can_view_destinations()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $country = Country::factory()->create();
        Destination::factory()->count(3)->create(['country_id' => $country->id]);

        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/destinations');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_normal_user_cannot_access_destinations()
    {
        $user = User::factory()->create();
        $user->assignRole('traveler');

        $this->actingAs($user, 'api')->getJson('/api/v1/admin/destinations')->assertStatus(403);
    }

    public function test_admin_can_create_destination_with_auto_coordinates()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $country = Country::factory()->create(['name' => 'France']);

        // Mock OpenStreetService
        $mockService = Mockery::mock(OpenStreetService::class);
        $mockService->shouldReceive('getCoordinates')
            ->with('Paris, France')
            ->once()
            ->andReturn(['lat' => 48.8566, 'lng' => 2.3522]);

        $this->app->instance(OpenStreetService::class, $mockService);

        $payload = [
            'name' => 'Eiffel Tower Area',
            'city_name' => 'Paris',
            'country_id' => $country->id,
            'description' => 'A nice place',
        ];

        $response = $this->actingAs($admin, 'api')->postJson('/api/v1/admin/destinations', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Eiffel Tower Area')
            ->assertJsonPath('data.latitude', 48.8566)
            ->assertJsonPath('data.longitude', 2.3522);

        $this->assertDatabaseHas('destinations', [
            'name' => 'Eiffel Tower Area',
            'latitude' => 48.8566,
            'longitude' => 2.3522,
        ]);
    }

    public function test_admin_can_update_destination()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $country = Country::factory()->create();
        $destination = Destination::factory()->create([
            'country_id' => $country->id,
            'name' => 'Old Name',
            'latitude' => 10.0,
            'longitude' => 20.0,
        ]);

        $payload = [
            'name' => 'New Name',
            'latitude' => 15.0, // Manually update coordinates
            'longitude' => 25.0,
        ];

        $response = $this->actingAs($admin, 'api')->putJson("/api/v1/admin/destinations/{$destination->id}", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'New Name');

        $this->assertEquals(15.0, (float) $response->json('data.latitude'));

        $this->assertDatabaseHas('destinations', [
            'id' => $destination->id,
            'name' => 'New Name',
            'latitude' => 15.0,
        ]);
    }

    public function test_admin_can_delete_destination()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $country = Country::factory()->create();
        $destination = Destination::factory()->create(['country_id' => $country->id]);

        $response = $this->actingAs($admin, 'api')->deleteJson("/api/v1/admin/destinations/{$destination->id}");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Destination deleted successfully.');

        $this->assertDatabaseMissing('destinations', ['id' => $destination->id]);
    }
}
