<?php

namespace Tests\Feature\Admin;

use App\Models\Country;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CountryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'traveler', 'guard_name' => 'api']);
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'api']);
        Permission::create(['name' => 'manage countries', 'guard_name' => 'api']);
        $adminRole->syncPermissions(['manage countries']);
    }

    public function test_admin_can_list_countries(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Country::factory()->count(3)->create();

        $this->actingAs($admin, 'api')->getJson('/api/v1/admin/countries')
            ->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_can_create_country(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin, 'api')->postJson('/api/v1/admin/countries', [
            'name' => 'Egypt',
            'iso_code' => 'EG',
            'languages' => ['ar', 'en'],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Egypt');

        $this->assertDatabaseHas('countries', ['name' => 'Egypt', 'iso_code' => 'EG']);
    }

    public function test_admin_can_update_country(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $country = Country::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($admin, 'api')->putJson("/api/v1/admin/countries/{$country->id}", [
            'name' => 'New Name',
            'iso_code' => $country->iso_code,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'New Name');

        $this->assertDatabaseHas('countries', ['id' => $country->id, 'name' => 'New Name']);
    }

    public function test_admin_can_delete_country(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $country = Country::factory()->create();

        $this->actingAs($admin, 'api')->deleteJson("/api/v1/admin/countries/{$country->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('countries', ['id' => $country->id]);
    }

    public function test_traveler_cannot_access_admin_countries(): void
    {
        $user = User::factory()->create();
        $user->assignRole('traveler');

        $this->actingAs($user, 'api')->getJson('/api/v1/admin/countries')->assertStatus(403);
        $this->actingAs($user, 'api')->postJson('/api/v1/admin/countries', [
            'name' => 'Hacked',
            'iso_code' => 'XX',
        ])->assertStatus(403);
    }
}
