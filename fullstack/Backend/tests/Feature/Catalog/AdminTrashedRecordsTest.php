<?php

namespace Tests\Feature\Catalog;

use App\Models\Account\User;
use App\Models\Catalog\Attraction;
use App\Models\Catalog\Category;
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

class AdminTrashedRecordsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

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
    }

    public function test_admin_default_index_hides_trashed_hotels(): void
    {
        $country = Country::factory()->create();
        $destination = Destination::factory()->create(['country_id' => $country->id]);
        $live = Hotel::factory()->create(['destination_id' => $destination->id]);
        $trashed = Hotel::factory()->create(['destination_id' => $destination->id]);
        $trashed->delete();

        $response = $this->actingAs($this->admin, 'api')->getJson('/api/admin/hotels');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($live->id));
        $this->assertFalse($ids->contains($trashed->id));
    }

    public function test_admin_can_list_only_trashed_hotels(): void
    {
        $country = Country::factory()->create();
        $destination = Destination::factory()->create(['country_id' => $country->id]);
        $live = Hotel::factory()->create(['destination_id' => $destination->id]);
        $trashed = Hotel::factory()->create(['destination_id' => $destination->id]);
        $trashed->delete();

        $response = $this->actingAs($this->admin, 'api')->getJson('/api/admin/hotels?trashed=1');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($trashed->id));
        $this->assertFalse($ids->contains($live->id));
    }

    public function test_trashed_flag_works_across_all_catalog_resources(): void
    {
        $country = Country::factory()->create();
        $destination = Destination::factory()->create(['country_id' => $country->id]);

        foreach (['restaurants' => Restaurant::class, 'attractions' => Attraction::class, 'flights' => Flight::class] as $path => $model) {
            $trashed = $model::factory()->create();
            $trashed->delete();

            $response = $this->actingAs($this->admin, 'api')->getJson("/api/admin/{$path}?trashed=1");

            $response->assertOk();
            $this->assertTrue(
                collect($response->json('data'))->pluck('id')->contains($trashed->id),
                "$path should expose trashed record"
            );
        }
    }

    public function test_trashed_countries_and_categories(): void
    {
        $trashedCountry = Country::factory()->create();
        $trashedCountry->delete();
        $trashedCategory = Category::factory()->create();
        $trashedCategory->delete();

        $this->actingAs($this->admin, 'api')->getJson('/api/admin/countries?trashed=1')
            ->assertOk()
            ->assertJsonFragment(['id' => $trashedCountry->id]);

        $this->actingAs($this->admin, 'api')->getJson('/api/admin/categories?trashed=1')
            ->assertOk()
            ->assertJsonFragment(['id' => $trashedCategory->id]);
    }

    public function test_trashed_destinations(): void
    {
        $country = Country::factory()->create();
        $trashed = Destination::factory()->create(['country_id' => $country->id]);
        $trashed->delete();

        $this->actingAs($this->admin, 'api')->getJson('/api/admin/destinations?trashed=1')
            ->assertOk()
            ->assertJsonFragment(['id' => $trashed->id]);
    }

    public function test_trashed_trips_and_reviews(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        $trip->delete();

        $hotel = Hotel::factory()->create();
        $review = Review::factory()->create([
            'user_id' => $user->id,
            'reviewable_id' => $hotel->id,
            'reviewable_type' => Hotel::class,
        ]);
        $review->delete();

        $trips = $this->actingAs($this->admin, 'api')->getJson('/api/admin/trips?trashed=1');
        $trips->assertOk();
        $this->assertTrue(collect($trips->json('data'))->pluck('id')->contains($trip->id));

        $reviews = $this->actingAs($this->admin, 'api')->getJson('/api/admin/reviews?trashed=1');
        $reviews->assertOk();
        $this->assertTrue(collect($reviews->json('data'))->pluck('id')->contains($review->id));
    }

    public function test_default_admin_index_excludes_trashed_trips(): void
    {
        $user = User::factory()->create();
        $trashed = Trip::factory()->create(['user_id' => $user->id]);
        $trashed->delete();

        $response = $this->actingAs($this->admin, 'api')->getJson('/api/admin/trips');

        $response->assertOk();
        $this->assertFalse(collect($response->json('data'))->pluck('id')->contains($trashed->id));
    }

    public function test_non_admin_cannot_access_trashed_view(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'api')->getJson('/api/admin/hotels?trashed=1')
            ->assertForbidden();
    }

    public function test_public_catalog_endpoints_never_expose_trashed_records(): void
    {
        $country = Country::factory()->create();
        $destination = Destination::factory()->create(['country_id' => $country->id]);
        $trashed = Hotel::factory()->create(['destination_id' => $destination->id]);
        $trashed->delete();

        $this->getJson('/api/hotels')
            ->assertOk()
            ->assertJsonMissing(['id' => $trashed->id]);
    }

    public function test_admin_destroy_soft_deletes_instead_of_hard_delete(): void
    {
        $country = Country::factory()->create();
        $destination = Destination::factory()->create(['country_id' => $country->id]);
        $hotel = Hotel::factory()->create(['destination_id' => $destination->id]);

        $this->actingAs($this->admin, 'api')->deleteJson("/api/admin/hotels/{$hotel->id}")->assertOk();

        $this->assertSoftDeleted('hotels', ['id' => $hotel->id]);
        $this->assertDatabaseHas('hotels', ['id' => $hotel->id]);
    }

    public function test_destroy_soft_deletes_trips_and_reviews(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        $hotel = Hotel::factory()->create();
        $review = Review::factory()->create([
            'user_id' => $user->id,
            'reviewable_id' => $hotel->id,
            'reviewable_type' => Hotel::class,
        ]);

        $this->actingAs($this->admin, 'api')->deleteJson("/api/admin/trips/{$trip->id}")->assertOk();
        $this->actingAs($this->admin, 'api')->deleteJson("/api/admin/reviews/{$review->id}")->assertOk();

        $this->assertSoftDeleted('trips', ['id' => $trip->id]);
        $this->assertSoftDeleted('reviews', ['id' => $review->id]);
    }

    public function test_restoring_one_record_does_not_affect_unrelated_records(): void
    {
        $country = Country::factory()->create();
        $destination = Destination::factory()->create(['country_id' => $country->id]);
        $hotelA = Hotel::factory()->create(['destination_id' => $destination->id]);
        $hotelB = Hotel::factory()->create(['destination_id' => $destination->id]);
        $hotelA->delete();
        $hotelB->delete();

        $this->actingAs($this->admin, 'api')
            ->patchJson("/api/admin/hotels/{$hotelA->id}/restore")
            ->assertOk();

        $this->assertNotSoftDeleted('hotels', ['id' => $hotelA->id]);
        $this->assertSoftDeleted('hotels', ['id' => $hotelB->id]);
    }
}
