<?php

namespace Tests\Feature;

use App\Models\Destination;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TripTest extends TestCase
{
    use RefreshDatabase;

    private function validTripPayload(): array
    {
        return [
            'title' => 'Weekend in Paris',
            'travel_style' => 'couple',
            'interests' => ['food', 'museums'],
            'no_of_travelers' => 2,
            'budget' => 1500,
            'no_of_days' => 5,
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-06',
        ];
    }

    public function test_create_returns_destinations_and_meta(): void
    {
        $user = User::factory()->create();
        $destination = Destination::factory()->create();

        $response = $this->actingAs($user, 'api')->getJson('/api/v1/trips/create');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.travel_styles', ['solo', 'couple', 'family', 'friends', 'business'])
                 ->assertJsonPath('data.budget_levels', ['low', 'medium', 'high']);

        $destinations = $response->json('data.destinations');
        $this->assertTrue(collect($destinations)->contains('id', $destination->id));
    }

    public function test_user_can_create_pending_trip(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/v1/trips', $this->validTripPayload());

        $response->assertStatus(201)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('message', 'Trip created successfully.')
                 ->assertJsonPath('data.title', 'Weekend in Paris')
                 ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('trips', [
            'user_id' => $user->id,
            'title' => 'Weekend in Paris',
            'status' => 'pending',
        ]);
    }

    public function test_create_trip_without_required_fields_returns_422(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/trips', [])
            ->assertStatus(422)
            ->assertJsonStructure([
                'success', 'message',
                'error' => ['title', 'travel_style', 'interests', 'no_of_travelers', 'budget', 'no_of_days', 'start_date', 'end_date'],
            ]);
    }

    public function test_owner_can_view_own_trip(): void
    {
        $owner = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner, 'api')
            ->getJson("/api/v1/trips/{$trip->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $trip->id);
    }

    public function test_other_user_cannot_view_trip(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($other, 'api')
            ->getJson("/api/v1/trips/{$trip->id}")
            ->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    public function test_unauthenticated_user_cannot_create_trip(): void
    {
        $this->postJson('/api/v1/trips', $this->validTripPayload())->assertStatus(401);
        $this->getJson('/api/v1/trips/create')->assertStatus(401);
    }
}