<?php

namespace Tests\Feature\Trips;

use App\Models\Account\User;
use App\Models\Catalog\Hotel;
use App\Models\Trips\Trip;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TripAttachDetachTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_attach()
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        $hotel = Hotel::factory()->create();

        $response = $this->actingAs($user, 'api')->postJson("/api/v1/trips/{$trip->id}/attach/hotel", [
            'item_id' => $hotel->id,
        ]);

        $response->assertStatus(200);
        $this->assertTrue($trip->hotels()->where('hotels.id', $hotel->id)->exists());
    }

    public function test_unauthorized_attach()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user1->id]);
        $hotel = Hotel::factory()->create();

        $response = $this->actingAs($user2, 'api')->postJson("/api/v1/trips/{$trip->id}/attach/hotel", [
            'item_id' => $hotel->id,
        ]);

        $response->assertStatus(404);
    }

    public function test_invalid_type()
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        $hotel = Hotel::factory()->create();

        $response = $this->actingAs($user, 'api')->postJson("/api/v1/trips/{$trip->id}/attach/invalidtype", [
            'item_id' => $hotel->id,
        ]);

        $response->assertStatus(400);
    }

    public function test_missing_item()
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'api')->postJson("/api/v1/trips/{$trip->id}/attach/hotel", []);

        $response->assertStatus(422);
    }

    public function test_nonexistent_item()
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'api')->postJson("/api/v1/trips/{$trip->id}/attach/hotel", [
            'item_id' => 9999,
        ]);

        $response->assertStatus(404);
    }

    public function test_duplicate_attach()
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        $hotel = Hotel::factory()->create();

        $trip->hotels()->attach($hotel->id);

        $response = $this->actingAs($user, 'api')->postJson("/api/v1/trips/{$trip->id}/attach/hotel", [
            'item_id' => $hotel->id,
        ]);

        $response->assertStatus(409);
    }

    public function test_valid_detach()
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        $hotel = Hotel::factory()->create();

        $trip->hotels()->attach($hotel->id);

        $response = $this->actingAs($user, 'api')->deleteJson("/api/v1/trips/{$trip->id}/detach/{$hotel->id}");

        $response->assertStatus(200);
        $this->assertFalse($trip->hotels()->where('hotels.id', $hotel->id)->exists());
    }

    public function test_nonexistent_relation_detach()
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'api')->deleteJson("/api/v1/trips/{$trip->id}/detach/9999");

        $response->assertStatus(404);
    }
}
