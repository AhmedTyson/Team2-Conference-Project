<?php

namespace Tests\Feature;

use App\Models\Attraction;
use App\Models\Destination;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class InteractionTest extends TestCase
{
    use RefreshDatabase;

    private function toggleAndAssert(string $type, object $entity): void
    {
        $user = User::factory()->create();

        // Add to favourites.
        $added = $this->actingAs($user, 'api')
            ->postJson("/api/v1/favourites/{$type}/{$entity->id}");

        $added->assertStatus(201)
              ->assertJsonPath('message', 'Added to favourites')
              ->assertJsonPath('status', 'added')
              ->assertJsonPath('data.favorable_id', $entity->id);

        $this->assertDatabaseHas('favourites', [
            'user_id' => $user->id,
            'favorable_type' => $type,
            'favorable_id' => $entity->id,
        ]);

        // Remove from favourites (toggle off).
        $removed = $this->actingAs($user, 'api')
            ->postJson("/api/v1/favourites/{$type}/{$entity->id}");

        $removed->assertStatus(200)
                ->assertJsonPath('message', 'Removed from favourites')
                ->assertJsonPath('status', 'removed');

        $this->assertDatabaseMissing('favourites', [
            'user_id' => $user->id,
            'favorable_type' => $type,
            'favorable_id' => $entity->id,
        ]);
    }

    public function test_toggle_hotel_favourite(): void
    {
        $this->toggleAndAssert('hotel', Hotel::factory()->create());
    }

    public function test_toggle_restaurant_favourite(): void
    {
        $this->toggleAndAssert('restaurant', Restaurant::factory()->create());
    }

    public function test_toggle_attraction_favourite(): void
    {
        $this->toggleAndAssert('attraction', Attraction::factory()->create());
    }

    public function test_toggle_destination_favourite(): void
    {
        $this->toggleAndAssert('destination', Destination::factory()->create());
    }

    public function test_flight_cannot_be_favourited(): void
    {
        $user = User::factory()->create();
        $flight = \App\Models\Flight::factory()->create();

        $this->actingAs($user, 'api')
            ->postJson("/api/v1/favourites/flight/{$flight->id}")
            ->assertStatus(400)
            ->assertJsonPath('message', 'Flights cannot be favourited.');
    }

    public function test_invalid_favourite_type_returns_404(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/favourites/car/1')
            ->assertStatus(404);
    }

    public function test_user_can_leave_review_with_pending_status(): void
    {
        $user = User::factory()->create();
        $hotel = Hotel::factory()->create();

        $response = $this->actingAs($user, 'api')
            ->postJson("/api/v1/reviews/hotel/{$hotel->id}", [
                'rating' => 5,
                'comment' => 'Amazing stay',
            ]);

        $response->assertStatus(201)
                 ->assertJsonPath('message', 'Review submitted successfully')
                 ->assertJsonPath('data.rating', 5)
                 ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('reviews', [
            'user_id' => $user->id,
            'reviewable_type' => 'hotel',
            'reviewable_id' => $hotel->id,
            'status' => 'pending',
        ]);
    }

    public function test_review_validation_fails_without_rating(): void
    {
        $user = User::factory()->create();
        $hotel = Hotel::factory()->create();

        $this->actingAs($user, 'api')
            ->postJson("/api/v1/reviews/hotel/{$hotel->id}", ['comment' => 'No rating'])
            ->assertStatus(422)
            ->assertJsonStructure(['success', 'message', 'error' => ['rating']]);
    }

    public function test_owner_can_delete_own_review(): void
    {
        $user = User::factory()->create();
        $hotel = Hotel::factory()->create();

        $reviewId = $this->actingAs($user, 'api')
            ->postJson("/api/v1/reviews/hotel/{$hotel->id}", ['rating' => 4, 'comment' => 'Nice'])
            ->json('data.id');

        $this->actingAs($user, 'api')
            ->deleteJson("/api/v1/reviews/{$reviewId}")
            ->assertStatus(200)
            ->assertJsonPath('message', 'Review deleted successfully');

        $this->assertDatabaseMissing('reviews', ['id' => $reviewId]);
    }

    public function test_non_owner_cannot_delete_review(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $hotel = Hotel::factory()->create();

        $reviewId = $this->actingAs($owner, 'api')
            ->postJson("/api/v1/reviews/hotel/{$hotel->id}", ['rating' => 4, 'comment' => 'Good'])
            ->json('data.id');

        $this->actingAs($other, 'api')
            ->deleteJson("/api/v1/reviews/{$reviewId}")
            ->assertStatus(403);

        $this->assertDatabaseHas('reviews', ['id' => $reviewId]);
    }
}