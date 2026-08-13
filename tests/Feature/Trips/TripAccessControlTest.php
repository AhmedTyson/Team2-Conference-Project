<?php

namespace Tests\Feature\Trips;

use App\Models\Account\User;
use App\Models\Catalog\Attraction;
use App\Models\Commerce\Plan;
use App\Models\Commerce\Subscription;
use App\Models\Trips\ItineraryItem;
use App\Models\Trips\Trip;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use LucianoTonet\GroqLaravel\Facades\Groq;
use Mockery;
use Tests\TestCase;

class TripAccessControlTest extends TestCase
{
    use RefreshDatabase;

    private function ownerWithQuota(): User
    {
        $owner = User::factory()->create(['is_active' => true]);
        $plan = Plan::factory()->create(['ai_quota_monthly' => 200]);
        Subscription::factory()->create([
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);

        return $owner;
    }

    private function tripWithTwoLocations(User $owner): Trip
    {
        $trip = Trip::factory()->create(['user_id' => $owner->id]);

        ItineraryItem::factory()->create([
            'trip_id' => $trip->id,
            'itemable_id' => Attraction::factory()->create([
                'latitude' => 30.0,
                'longitude' => 31.2,
            ])->id,
            'itemable_type' => Attraction::class,
            'day_number' => 1,
            'item_order' => 1,
        ]);

        ItineraryItem::factory()->create([
            'trip_id' => $trip->id,
            'itemable_id' => Attraction::factory()->create([
                'latitude' => 31.0,
                'longitude' => 32.2,
            ])->id,
            'itemable_type' => Attraction::class,
            'day_number' => 1,
            'item_order' => 2,
        ]);

        return $trip;
    }

    private function mockGroq(): void
    {
        $chain = Mockery::mock();
        $chain->shouldReceive('completions')->andReturnSelf();
        $chain->shouldReceive('create')->andReturn([
            'choices' => [
                ['message' => ['content' => '{"review_summary":"Nice trip"}']],
            ],
        ]);

        $chat = Mockery::mock();
        $chat->shouldReceive('completions')->andReturn($chain);

        Groq::shouldReceive('chat')->andReturn($chat);
    }

    public function test_owner_can_review_own_trip(): void
    {
        $owner = $this->ownerWithQuota();
        $trip = $this->tripWithTwoLocations($owner);

        $this->mockGroq();

        $this->actingAs($owner, 'api')
            ->getJson("/api/review/{$trip->id}")
            ->assertOk()
            ->assertJsonPath('data.review_summary', 'Nice trip');
    }

    public function test_user_cannot_review_another_users_trip(): void
    {
        $owner = $this->ownerWithQuota();
        $trip = $this->tripWithTwoLocations($owner);
        $attacker = User::factory()->create(['is_active' => true]);

        Groq::shouldReceive('chat')->never();

        $this->actingAs($attacker, 'api')
            ->getJson("/api/review/{$trip->id}")
            ->assertStatus(404);

        // Authorization happened before quota consumption or any AI call.
        $this->assertEquals(0, $attacker->fresh()->ai_generations_count);
    }

    public function test_owner_can_map_own_trip(): void
    {
        $owner = $this->ownerWithQuota();
        $trip = $this->tripWithTwoLocations($owner);

        Http::fake([
            'router.project-osrm.org/*' => Http::response([
                'code' => 'Ok',
                'routes' => [[
                    'distance' => 10000,
                    'duration' => 600,
                    'geometry' => 'encoded-geometry',
                ]],
            ], 200),
        ]);

        $this->actingAs($owner, 'api')
            ->getJson("/api/v1/maps/trip/{$trip->id}")
            ->assertOk()
            ->assertJsonPath('data.directions.distance_km', 10);
    }

    public function test_user_cannot_map_another_users_trip(): void
    {
        $owner = $this->ownerWithQuota();
        $trip = $this->tripWithTwoLocations($owner);
        $attacker = User::factory()->create(['is_active' => true]);

        Http::fake();

        $this->actingAs($attacker, 'api')
            ->getJson("/api/v1/maps/trip/{$trip->id}")
            ->assertStatus(404);

        // No external map processing happened for the unauthorized request.
        Http::assertNothingSent();
    }
}
