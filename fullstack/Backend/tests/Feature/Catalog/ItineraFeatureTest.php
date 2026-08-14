<?php

namespace Tests\Feature\Catalog;

use App\Enums\ReviewStatus;
use App\Interfaces\Commerce\PaymentGatewayInterface;
use App\Models\Account\User;
use App\Models\Catalog\Country;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Flight;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Region;
use App\Models\Trips\Review;
use App\Models\Trips\Trip;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ItineraFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach ([
            'africa' => 'Africa',
            'asia' => 'Asia',
            'europe' => 'Europe',
            'north_america' => 'North America',
            'south_america' => 'South America',
            'oceania' => 'Oceania',
        ] as $key => $label) {
            Region::create(['key' => $key, 'label' => $label]);
        }
    }

    private function makeCountry(string $iso, string $regionKey, string $name = 'Testland'): Country
    {
        return Country::create([
            'name' => $name,
            'iso_code' => $iso,
            'region_id' => Region::where('key', $regionKey)->value('id'),
            'languages' => ['English'],
        ]);
    }

    private function makeTrip(User $user, Destination $destination): Trip
    {
        $trip = Trip::create([
            'user_id' => $user->id,
            'title' => 'Tour to '.$destination->name,
            'travel_style' => 'solo',
            'no_of_travelers' => 1,
            'budget' => 1000,
            'no_of_days' => 3,
            'start_date' => now()->addDays(3),
            'end_date' => now()->addDays(6),
            'status' => 'planning',
        ]);

        $trip->destinations()->attach($destination, [
            'day_number' => 1,
            'visit_order' => 1,
            'estimated_date' => now()->addDays(3),
            'notes' => 'Day 1 stop',
        ]);

        return $trip;
    }

    private function makeHotelReview(Hotel $hotel, User $user, int $rating, string $status): Review
    {
        $review = new Review([
            'user_id' => $user->id,
            'reviewable_type' => $hotel->getMorphClass(),
            'reviewable_id' => $hotel->id,
            'rating' => $rating,
            'comment' => 'A fair review',
        ]);

        $review->status = $status;
        $review->save();

        return $review;
    }

    public function test_regions_index_returns_all_option_then_seeded_regions()
    {
        $response = $this->getJson('/api/v1/regions');

        $response->assertStatus(200)
            ->assertJsonCount(7)
            ->assertJsonPath('0.id', 'all')
            ->assertJsonPath('0.label', 'All destinations');

        $keys = collect($response->json())->pluck('id');

        $this->assertContains('europe', $keys);
        $this->assertContains('africa', $keys);
        $this->assertContains('oceania', $keys);
    }

    public function test_destinations_can_be_filtered_by_region()
    {
        $france = $this->makeCountry('FR', 'europe', 'France');
        $japan = $this->makeCountry('JP', 'asia', 'Japan');

        $paris = Destination::factory()->create(['country_id' => $france->id, 'name' => 'Paris', 'city_name' => 'Paris']);
        Destination::factory()->create(['country_id' => $japan->id, 'name' => 'Tokyo', 'city_name' => 'Tokyo']);

        $response = $this->getJson('/api/v1/destinations?region=europe');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $paris->id)
            ->assertJsonPath('data.0.region.id', 'europe');

        $this->getJson('/api/v1/destinations?region=all')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data');

        $this->getJson('/api/v1/destinations?region=atlantis')
            ->assertStatus(422);
    }

    public function test_destinations_can_be_searched()
    {
        $egypt = $this->makeCountry('EG', 'africa', 'Egypt');

        $giza = Destination::factory()->create(['country_id' => $egypt->id, 'name' => 'Giza', 'city_name' => 'Cairo']);
        Destination::factory()->create(['country_id' => $egypt->id, 'name' => 'Luxor', 'city_name' => 'Luxor']);

        $this->getJson('/api/v1/destinations?query=Giza')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $giza->id);

        $this->getJson('/api/v1/destinations?query=Cairo')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/destinations?query=Egypt')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_destination_card_includes_region_hotels_and_tours_counts()
    {
        $italy = $this->makeCountry('IT', 'europe', 'Italy');
        $destination = Destination::factory()->create(['country_id' => $italy->id]);

        Hotel::factory()->count(3)->create(['destination_id' => $destination->id]);
        $this->makeTrip(User::factory()->create(), $destination);

        $response = $this->getJson('/api/v1/destinations');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.region.id', 'europe')
            ->assertJsonPath('data.0.country.name', 'Italy')
            ->assertJsonPath('data.0.hotels_count', 3)
            ->assertJsonPath('data.0.tours_count', 1)
            ->assertJsonMissingPath('data.0.price')
            ->assertJsonMissingPath('data.0.days')
            ->assertJsonMissingPath('data.0.discount');
    }

    public function test_destination_detail_includes_counts_and_distinct_user_count()
    {
        $italy = $this->makeCountry('IT', 'europe', 'Italy');
        $destination = Destination::factory()->create(['country_id' => $italy->id]);

        Hotel::factory()->count(2)->create(['destination_id' => $destination->id]);

        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $this->makeTrip($userA, $destination);
        $this->makeTrip($userA, $destination);
        $this->makeTrip($userB, $destination);

        $response = $this->getJson("/api/v1/destinations/{$destination->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.hotels_count', 2)
            ->assertJsonPath('data.tours_count', 3)
            ->assertJsonPath('data.user_count', 2)
            ->assertJsonPath('data.region.id', 'europe')
            ->assertJsonMissingPath('data.price')
            ->assertJsonMissingPath('data.best_time')
            ->assertJsonMissingPath('data.visa');
    }

    public function test_destination_hotels_include_approved_review_counts()
    {
        $italy = $this->makeCountry('IT', 'europe', 'Italy');
        $destination = Destination::factory()->create(['country_id' => $italy->id]);

        $hotel = Hotel::factory()->create(['destination_id' => $destination->id]);
        Hotel::factory()->create(['destination_id' => $destination->id]);

        $user = User::factory()->create();
        $this->makeHotelReview($hotel, $user, 5, ReviewStatus::APPROVED->value);
        $this->makeHotelReview($hotel, $user, 2, ReviewStatus::PENDING->value);

        $response = $this->getJson("/api/v1/destinations/{$destination->id}/hotels");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.reviews_count', 1);
    }

    public function test_hotel_reviews_return_only_approved_reviews()
    {
        $italy = $this->makeCountry('IT', 'europe', 'Italy');
        $destination = Destination::factory()->create(['country_id' => $italy->id]);

        $hotel = Hotel::factory()->create(['destination_id' => $destination->id]);
        $user = User::factory()->create();

        $this->makeHotelReview($hotel, $user, 5, ReviewStatus::APPROVED->value);
        $this->makeHotelReview($hotel, $user, 4, ReviewStatus::APPROVED->value);
        $this->makeHotelReview($hotel, $user, 1, ReviewStatus::PENDING->value);
        $this->makeHotelReview($hotel, $user, 2, ReviewStatus::REJECTED->value);

        $response = $this->getJson("/api/v1/hotels/{$hotel->id}/reviews");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.status', ReviewStatus::APPROVED->value);
    }

    public function test_stats_summary_uses_real_counts()
    {
        $italy = $this->makeCountry('IT', 'europe', 'Italy');
        $destination = Destination::factory()->create(['country_id' => $italy->id]);

        Hotel::factory()->count(2)->create(['destination_id' => $destination->id]);
        Flight::factory()->count(3)->create();

        $user = User::factory()->create();
        $this->makeTrip($user, $destination);

        $this->makeHotelReview(Hotel::first(), $user, 5, ReviewStatus::APPROVED->value);
        $this->makeHotelReview(Hotel::first(), $user, 4, ReviewStatus::PENDING->value);

        $response = $this->getJson('/api/v1/stats/summary');

        $response->assertStatus(200)
            ->assertJsonPath('data.hotels', 2)
            ->assertJsonPath('data.tours', 1)
            ->assertJsonPath('data.flights', 3)
            ->assertJsonPath('data.reviews', '1');
    }

    public function test_booking_requires_authentication()
    {
        $italy = $this->makeCountry('IT', 'europe', 'Italy');
        $destination = Destination::factory()->create(['country_id' => $italy->id]);

        $this->postJson("/api/v1/destinations/{$destination->id}/book")
            ->assertStatus(401);
    }

    public function test_booking_validates_guests()
    {
        $user = User::factory()->create();
        $italy = $this->makeCountry('IT', 'europe', 'Italy');
        $destination = Destination::factory()->create(['country_id' => $italy->id]);

        $this->actingAs($user, 'api')
            ->postJson("/api/v1/destinations/{$destination->id}/book", ['guests' => 0])
            ->assertStatus(422);
    }

    public function test_booking_delegates_to_existing_checkout_flow()
    {
        $this->mock(PaymentGatewayInterface::class, function ($mock) {
            $mock->shouldReceive('createIntention')->andReturn([
                'success' => true,
                'client_secret' => 'test_secret_123',
                'checkout_url' => 'https://checkout.example.com/test',
                'message' => 'Intention created successfully',
            ]);
        });

        $user = User::factory()->create();
        $italy = $this->makeCountry('IT', 'europe', 'Italy');
        $destination = Destination::factory()->create(['country_id' => $italy->id]);

        $trip = $this->makeTrip($user, $destination);
        $trip->hotels()->attach(Hotel::factory()->create([
            'destination_id' => $destination->id,
            'price_per_night' => 150,
        ])->id);

        $response = $this->actingAs($user, 'api')
            ->postJson("/api/v1/destinations/{$destination->id}/book", ['guests' => 2]);

        $response->assertStatus(201)
            ->assertJsonStructure(['success', 'data' => ['order_id', 'client_secret', 'checkout_url']]);

        $orderId = $response->json('data.order_id');

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('order_items', ['order_id' => $orderId]);
        $this->assertDatabaseHas('payments', ['order_id' => $orderId, 'status' => 'pending']);
    }

    public function test_booking_fails_when_destination_has_no_trip()
    {
        $user = User::factory()->create();
        $italy = $this->makeCountry('IT', 'europe', 'Italy');
        $destination = Destination::factory()->create(['country_id' => $italy->id]);

        $response = $this->actingAs($user, 'api')
            ->postJson("/api/v1/destinations/{$destination->id}/book");

        $response->assertStatus(422)
            ->assertJsonPath('error.type', 'booking_failed');
    }
}
