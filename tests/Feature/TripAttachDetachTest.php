<?php

namespace Tests\Feature;

use App\Models\Attraction;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TripAttachDetachTest extends TestCase
{
    use RefreshDatabase;

    private function ownerTrip(User $user): Trip
    {
        return Trip::factory()->create(['user_id' => $user->id]);
    }

    public function test_owner_can_attach_hotel_to_trip(): void
    {
        $user = User::factory()->create();
        $trip = $this->ownerTrip($user);
        $hotel = Hotel::factory()->create();

        $response = $this->actingAs($user, 'api')
            ->postJson("/api/v1/trips/{$trip->id}/attach/hotels", ['id' => $hotel->id]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('trip_items', [
            'trip_id' => $trip->id,
            'item_type' => 'hotel',
            'item_id' => $hotel->id,
        ]);
    }

    public function test_owner_can_attach_restaurant_to_trip(): void
    {
        $user = User::factory()->create();
        $trip = $this->ownerTrip($user);
        $restaurant = Restaurant::factory()->create();

        $response = $this->actingAs($user, 'api')
            ->postJson("/api/v1/trips/{$trip->id}/attach/restaurants", ['id' => $restaurant->id]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('trip_items', [
            'trip_id' => $trip->id,
            'item_type' => 'restaurant',
            'item_id' => $restaurant->id,
        ]);
    }

    public function test_owner_can_attach_attraction_to_trip(): void
    {
        $user = User::factory()->create();
        $trip = $this->ownerTrip($user);
        $attraction = Attraction::factory()->create();

        $response = $this->actingAs($user, 'api')
            ->postJson("/api/v1/trips/{$trip->id}/attach/attractions", ['id' => $attraction->id]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('trip_items', [
            'trip_id' => $trip->id,
            'item_type' => 'attraction',
            'item_id' => $attraction->id,
        ]);
    }

    public function test_attach_same_item_twice_does_not_duplicate(): void
    {
        $user = User::factory()->create();
        $trip = $this->ownerTrip($user);
        $hotel = Hotel::factory()->create();

        $this->actingAs($user, 'api')
            ->postJson("/api/v1/trips/{$trip->id}/attach/hotels", ['id' => $hotel->id])
            ->assertStatus(200);
        $this->actingAs($user, 'api')
            ->postJson("/api/v1/trips/{$trip->id}/attach/hotels", ['id' => $hotel->id])
            ->assertStatus(200);

        $this->assertEquals(1, DB::table('trip_items')
            ->where('trip_id', $trip->id)
            ->where('item_type', 'hotel')
            ->where('item_id', $hotel->id)
            ->count());
    }

    public function test_non_owner_cannot_attach_to_trip(): void
    {
        $owner = User::factory()->create();
        $trip = $this->ownerTrip($owner);
        $other = User::factory()->create();
        $hotel = Hotel::factory()->create();

        $response = $this->actingAs($other, 'api')
            ->postJson("/api/v1/trips/{$trip->id}/attach/hotels", ['id' => $hotel->id]);

        $response->assertStatus(404);
    }

    public function test_attach_with_invalid_type_returns_422(): void
    {
        $user = User::factory()->create();
        $trip = $this->ownerTrip($user);

        $response = $this->actingAs($user, 'api')
            ->postJson("/api/v1/trips/{$trip->id}/attach/airplanes", ['id' => 1]);

        $response->assertStatus(422);
    }

    public function test_attach_with_nonexistent_item_returns_404(): void
    {
        $user = User::factory()->create();
        $trip = $this->ownerTrip($user);

        $response = $this->actingAs($user, 'api')
            ->postJson("/api/v1/trips/{$trip->id}/attach/hotels", ['id' => 999999]);

        $response->assertStatus(404);
    }

    public function test_owner_can_detach_item_from_trip(): void
    {
        $user = User::factory()->create();
        $trip = $this->ownerTrip($user);
        $hotel = Hotel::factory()->create();
        $trip->hotels()->attach($hotel->id);

        $pivotId = DB::table('trip_items')
            ->where('trip_id', $trip->id)
            ->value('id');

        $response = $this->actingAs($user, 'api')
            ->deleteJson("/api/v1/trips/{$trip->id}/detach/{$pivotId}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('trip_items', ['id' => $pivotId]);
    }

    public function test_detach_non_attached_id_returns_404(): void
    {
        $user = User::factory()->create();
        $trip = $this->ownerTrip($user);

        $response = $this->actingAs($user, 'api')
            ->deleteJson("/api/v1/trips/{$trip->id}/detach/999999");

        $response->assertStatus(404);
    }
}
