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

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        return $admin;
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Jordan',
            'iso_code' => 'JO',
            'capital' => 'Amman',
            'flag_url' => 'https://example.com/jo.png',
            'currency' => 'JOD',
            'languages' => ['ar'],
        ], $overrides);
    }

    public function test_admin_can_list_countries(): void
    {
        Country::factory()->count(3)->create();

        $response = $this->actingAs($this->admin(), 'api')->getJson('/api/v1/admin/countries');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data.data');
    }

    public function test_admin_can_create_country(): void
    {
        $response = $this->actingAs($this->admin(), 'api')
            ->postJson('/api/v1/admin/countries', $this->validPayload());

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Country created successfully.')
            ->assertJsonPath('data.name', 'Jordan');

        $this->assertDatabaseHas('countries', ['name' => 'Jordan', 'iso_code' => 'JO']);
    }

    public function test_admin_create_country_validation_fails_with_422(): void
    {
        $this->actingAs($this->admin(), 'api')
            ->postJson('/api/v1/admin/countries', ['name' => 'Jordan'])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_admin_create_country_duplicate_iso_code_fails_with_422(): void
    {
        Country::factory()->create(['iso_code' => 'JO']);

        $this->actingAs($this->admin(), 'api')
            ->postJson('/api/v1/admin/countries', $this->validPayload())
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_update_country(): void
    {
        $country = Country::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($this->admin(), 'api')
            ->putJson("/api/v1/admin/countries/{$country->id}", $this->validPayload(['name' => 'Kingdom of Jordan']));

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Country updated successfully.')
            ->assertJsonPath('data.name', 'Kingdom of Jordan');

        $this->assertDatabaseHas('countries', ['id' => $country->id, 'name' => 'Kingdom of Jordan']);
    }

    public function test_admin_can_destroy_country(): void
    {
        $country = Country::factory()->create();

        $response = $this->actingAs($this->admin(), 'api')
            ->deleteJson("/api/v1/admin/countries/{$country->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Country deleted successfully.');

        $this->assertDatabaseMissing('countries', ['id' => $country->id]);
    }

    public function test_traveler_cannot_manage_countries(): void
    {
        $user = User::factory()->create();
        $user->assignRole('traveler');

        $country = Country::factory()->create();

        $this->actingAs($user, 'api')->getJson('/api/v1/admin/countries')->assertStatus(403);
        $this->actingAs($user, 'api')->postJson('/api/v1/admin/countries', $this->validPayload())->assertStatus(403);
        $this->actingAs($user, 'api')->putJson("/api/v1/admin/countries/{$country->id}", $this->validPayload())->assertStatus(403);
        $this->actingAs($user, 'api')->deleteJson("/api/v1/admin/countries/{$country->id}")->assertStatus(403);
    }
}