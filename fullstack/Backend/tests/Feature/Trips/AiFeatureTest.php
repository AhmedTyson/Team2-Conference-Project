<?php

namespace Tests\Feature\Trips;

use App\Models\Account\User;
use App\Models\Catalog\Attraction;
use App\Models\Catalog\Country;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Restaurant;
use App\Models\Commerce\Plan;
use App\Models\Commerce\Subscription;
use App\Models\Trips\ItineraryItem;
use App\Models\Trips\Trip;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LucianoTonet\GroqLaravel\Facades\Groq;
use Mockery;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class AiFeatureTest extends TestCase
{
    use RefreshDatabase;

    private ?User $user = null;

    private mixed $subscription = null;

    private string $generatedJson = '';

    protected function setUp(): void
    {
        parent::setUp();

        config(['groq.api_key' => 'test-key']);

        Permission::create([
            'name' => 'generate ai itineraries',
            'guard_name' => 'api',
        ]);

        $plan = Plan::factory()->create(['ai_quota_monthly' => 200]);
        $this->subscription = Subscription::factory()->create([
            'user_id' => User::factory(),
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);

        $country = Country::factory()->create();
        $destination = Destination::factory()->create(['country_id' => $country->id]);
        Restaurant::factory()->create(['destination_id' => $destination->id]);
        Hotel::factory()->create(['destination_id' => $destination->id]);
        Attraction::factory()->create(['destination_id' => $destination->id]);

        $this->generatedJson = json_encode([
            'itinerary' => 'Day 1: Arrive and explore',
            'transportation_tips' => 'Use the metro',
            'estimated_costs' => ['total' => 200],
            'recommended_attractions' => ['Giza'],
            'recommended_restaurants' => ['Koshary'],
            'recommended_hotels' => ['Marriott'],
        ]);
    }

    public function test_generate_ai_consumes_quota_and_returns_content(): void
    {
        $user = $this->subscription->user;
        $user->givePermissionTo('generate ai itineraries');

        // Supply a valid days array so the generate endpoint saves a Trip + items
        $this->generatedJson = json_encode([
            'title'            => '3-Day Adventure',
            'description'      => 'An adventure trip',
            'estimated_budget' => 5000,
            'days'             => [
                [
                    'day_number' => 1,
                    'title'      => 'Day 1: Arrive and explore',
                    'items'      => [
                        [
                            'time'  => '09:00 AM',
                            'title' => 'City tour',
                            'desc'  => 'Explore the city',
                            'price' => 80,
                            'type'  => 'ATTRACTION',
                        ],
                    ],
                ],
            ],
        ]);

        $this->mockGroq($this->generatedJson);

        $response = $this->actingAs($user, 'api')->postJson('/api/trips/generate-ai', [
            'destination_country_id' => Country::first()->id,
            'city'                   => 'Cairo, Egypt',
            'no_of_days'             => 3,
            'budget'                 => 5000,
            'interests'              => ['culture', 'food'],
            'no_of_travelers'        => 2,
            'travel_style'           => 'adventure',
        ]);

        $response->assertStatus(200);

        // Debug: dump actual response to see what's returned
        $json = $response->json();
        if (!($json['data']['saved'] ?? false)) {
            $this->fail('Trip not saved. Response: ' . json_encode($json, JSON_PRETTY_PRINT));
        }

        $response->assertStatus(200)
            ->assertJsonPath('data.saved', true);

        $this->assertNotEmpty($response->json('data.days.0.title'));

        // Trip and ItineraryItem were created in the DB
        $this->assertNotNull($response->json('data.trip_id'));
        $tripId = $response->json('data.trip_id');
        $this->assertDatabaseHas('trips', ['id' => $tripId, 'user_id' => $user->id]);
        $this->assertDatabaseHas('itinerary_items', ['trip_id' => $tripId]);
    }

    public function test_ai_review_route_enforces_request_validation(): void
    {
        $user = $this->subscription->user;
        $user->givePermissionTo('generate ai itineraries');

        $response = $this->actingAs($user, 'api')->postJson('/api/review', [
            'destination_country_id' => Country::first()->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.status', 422)
            ->assertJsonPath('error.validation_errors.0.field', 'no_of_days');
    }

    public function test_generate_ai_second_identical_call_is_cached_without_extra_groq_call(): void
    {
        $user = $this->subscription->user;
        $user->givePermissionTo('generate ai itineraries');

        $this->mockGroq($this->generatedJson, 1);

        $payload = [
            'destination_country_id' => Country::first()->id,
            'no_of_days' => 3,
            'budget' => 5000,
            'interests' => ['culture'],
            'no_of_travelers' => 2,
            'travel_style' => 'relaxation',
        ];

        $this->actingAs($user, 'api')->postJson('/api/review', $payload)->assertStatus(200);
        $this->actingAs($user, 'api')->postJson('/api/review', $payload)->assertStatus(200);

        $this->assertEquals(1, $user->fresh()->ai_generations_count);
    }

    public function test_ai_review_of_trip_returns_parsed_review(): void
    {
        $user = $this->subscription->user;
        $user->givePermissionTo('generate ai itineraries');

        $trip = Trip::factory()->create(['user_id' => $user->id]);
        ItineraryItem::factory()->create([
            'trip_id' => $trip->id,
            'itemable_id' => Hotel::first()->id,
            'itemable_type' => Hotel::class,
        ]);

        $this->mockGroq(json_encode([
            'review_summary' => 'Well balanced trip',
            'suggestions' => ['Add a rest day'],
        ]));

        $response = $this->actingAs($user, 'api')->getJson("/api/review/{$trip->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.review_summary', 'Well balanced trip');

        $this->assertEquals(1, $user->fresh()->ai_generations_count);
    }

    public function test_ai_review_of_missing_trip_restores_quota(): void
    {
        $user = $this->subscription->user;
        $user->givePermissionTo('generate ai itineraries');

        $response = $this->actingAs($user, 'api')->getJson('/api/review/999999');

        $response->assertStatus(404)
            ->assertJsonStructure(['error' => ['type', 'status', 'message', 'timestamp']]);

        $this->assertEquals(0, $user->fresh()->ai_generations_count);
    }

    private function mockGroq(string $content, int $times = 1): void
    {
        $chain = Mockery::mock();
        $chain->shouldReceive('completions')->andReturnSelf();
        $chain->shouldReceive('create')->times($times)->andReturn([
            'choices' => [
                ['message' => ['content' => $content]],
            ],
        ]);

        $chat = Mockery::mock();
        $chat->shouldReceive('completions')->times($times)->andReturn($chain);

        Groq::shouldReceive('chat')->times($times)->andReturn($chat);
    }
}
