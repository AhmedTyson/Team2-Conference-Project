<?php

namespace Tests\Feature\Catalog;

use App\Models\Account\User;
use App\Models\Catalog\Attraction;
use App\Models\Catalog\Country;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Flight;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Restaurant;
use App\Models\Trips\Review;
use App\Models\Trips\Trip;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminRestoreTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'admin', 'guard_name' => 'api']);

        foreach ([
            'manage hotels', 'manage restaurants', 'manage attractions', 'manage flights',
            'manage countries', 'manage categories', 'manage destinations',
            'manage trips', 'manage reviews',
        ] as $permission) {
            Permission::create(['name' => $permission, 'guard_name' => 'api']);
            $role->givePermissionTo($permission);
        }

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        $this->user = User::factory()->create();
    }

    public function test_authorized_admin_restores_trashed_hotel(): void
    {
        $country = Country::factory()->create();
        $destination = Destination::factory()->create(['country_id' => $country->id]);
        $hotel = Hotel::factory()->create(['destination_id' => $destination->id]);
        $hotel->delete();

        $response = $this->actingAs($this->admin, 'api')
            ->patchJson("/api/admin/hotels/{$hotel->id}/restore");

        $response->assertOk()->assertJson(['success' => true]);
        $this->assertDatabaseHas('hotels', ['id' => $hotel->id, 'deleted_at' => null]);

        $this->actingAs($this->admin, 'api')->getJson('/api/admin/hotels')
            ->assertOk()
            ->assertJsonFragment(['id' => $hotel->id]);
    }

    public function test_restore_removes_hotel_from_trashed_list(): void
    {
        $country = Country::factory()->create();
        $destination = Destination::factory()->create(['country_id' => $country->id]);
        $hotel = Hotel::factory()->create(['destination_id' => $destination->id]);
        $hotel->delete();

        $this->actingAs($this->admin, 'api')
            ->patchJson("/api/admin/hotels/{$hotel->id}/restore")
            ->assertOk();

        $this->actingAs($this->admin, 'api')->getJson('/api/admin/hotels?trashed=1')
            ->assertOk()
            ->assertJsonMissing(['id' => $hotel->id]);
    }

    public function test_restore_works_for_every_soft_delete_resource(): void
    {
        $country = Country::factory()->create();
        $destination = Destination::factory()->create(['country_id' => $country->id]);

        $records = [
            'restaurants' => Restaurant::factory()->create(),
            'attractions' => Attraction::factory()->create(),
            'flights' => Flight::factory()->create(),
        ];

        foreach ($records as $path => $record) {
            $record->delete();
            $this->actingAs($this->admin, 'api')
                ->patchJson("/api/admin/{$path}/{$record->id}/restore")
                ->assertOk()
                ->assertJson(['success' => true]);
            $this->assertDatabaseHas($record->getTable(), ['id' => $record->id, 'deleted_at' => null]);
        }

        $country->delete();
        $this->actingAs($this->admin, 'api')
            ->patchJson("/api/admin/countries/{$country->id}/restore")
            ->assertOk();
        $this->assertDatabaseHas('countries', ['id' => $country->id, 'deleted_at' => null]);

        $destination->delete();
        $this->actingAs($this->admin, 'api')
            ->patchJson("/api/admin/destinations/{$destination->id}/restore")
            ->assertOk();
        $this->assertDatabaseHas('destinations', ['id' => $destination->id, 'deleted_at' => null]);
    }

    public function test_restore_works_for_trips_and_reviews(): void
    {
        $trip = Trip::factory()->create(['user_id' => $this->user->id]);
        $trip->delete();

        $hotel = Hotel::factory()->create();
        $review = Review::factory()->create([
            'user_id' => $this->user->id,
            'reviewable_id' => $hotel->id,
            'reviewable_type' => Hotel::class,
        ]);
        $review->delete();

        $this->actingAs($this->admin, 'api')
            ->patchJson("/api/admin/trips/{$trip->id}/restore")
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->actingAs($this->admin, 'api')
            ->patchJson("/api/admin/reviews/{$review->id}/restore")
            ->assertOk()
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('trips', ['id' => $trip->id, 'deleted_at' => null]);
        $this->assertDatabaseHas('reviews', ['id' => $review->id, 'deleted_at' => null]);
    }

    public function test_unauthorized_user_cannot_restore(): void
    {
        $country = Country::factory()->create();
        $destination = Destination::factory()->create(['country_id' => $country->id]);
        $hotel = Hotel::factory()->create(['destination_id' => $destination->id]);
        $hotel->delete();

        $this->actingAs($this->user, 'api')
            ->patchJson("/api/admin/hotels/{$hotel->id}/restore")
            ->assertForbidden();
    }

    public function test_active_record_restore_is_rejected(): void
    {
        $hotel = Hotel::factory()->create();

        $this->actingAs($this->admin, 'api')
            ->patchJson("/api/admin/hotels/{$hotel->id}/restore")
            ->assertNotFound();
    }

    public function test_nonexistent_record_restore_is_not_found(): void
    {
        $this->actingAs($this->admin, 'api')
            ->patchJson('/api/admin/hotels/999999/restore')
            ->assertNotFound();
    }

    public function test_restored_record_returns_to_normal_public_listing(): void
    {
        $country = Country::factory()->create();
        $destination = Destination::factory()->create(['country_id' => $country->id]);
        $hotel = Hotel::factory()->create(['destination_id' => $destination->id]);
        $hotel->delete();

        $this->actingAs($this->admin, 'api')
            ->patchJson("/api/admin/hotels/{$hotel->id}/restore")
            ->assertOk();

        $this->getJson('/api/hotels')
            ->assertOk()
            ->assertJsonFragment(['id' => $hotel->id]);
    }
}
