<?php

namespace Tests\Feature\Admin;

use App\Enums\TripStatus;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TripTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'traveler', 'guard_name' => 'api']);
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'api']);

        Permission::create(['name' => 'manage trips', 'guard_name' => 'api']);
        $adminRole->syncPermissions(['manage trips']);
    }

    public function test_admin_can_list_all_trips(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Trip::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/trips');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_can_update_trip_with_partial_merge(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $trip = Trip::factory()->create([
            'title' => 'Original Title',
            'travel_style' => 'adventure',
            'no_of_travelers' => 2,
        ]);

        $response = $this->actingAs($admin, 'api')
            ->putJson("/api/v1/admin/trips/{$trip->id}", [
                'title' => 'Updated Title',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Updated Title');

        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'title' => 'Updated Title',
            'travel_style' => 'adventure',
        ]);
    }

    public function test_admin_update_trip_persists_status(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $trip = Trip::factory()->create(['status' => TripStatus::PENDING->value]);

        $response = $this->actingAs($admin, 'api')
            ->putJson("/api/v1/admin/trips/{$trip->id}", [
                'title' => 'Still Works',
                'status' => TripStatus::BOOKED->value,
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'status' => TripStatus::BOOKED->value,
        ]);
    }

    public function test_admin_can_destroy_trip(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $trip = Trip::factory()->create();

        $response = $this->actingAs($admin, 'api')
            ->deleteJson("/api/v1/admin/trips/{$trip->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Trip deleted successfully.');

        $this->assertDatabaseMissing('trips', ['id' => $trip->id]);
    }

    public function test_traveler_cannot_manage_trips(): void
    {
        $user = User::factory()->create();
        $user->assignRole('traveler');

        $trip = Trip::factory()->create();

        $this->actingAs($user, 'api')->getJson('/api/v1/admin/trips')->assertStatus(403);
        $this->actingAs($user, 'api')->putJson("/api/v1/admin/trips/{$trip->id}", ['title' => 'x'])->assertStatus(403);
        $this->actingAs($user, 'api')->deleteJson("/api/v1/admin/trips/{$trip->id}")->assertStatus(403);
    }
}