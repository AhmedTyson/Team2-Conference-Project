<?php

namespace Tests\Feature;

use App\Models\Attraction;
use App\Models\Category;
use App\Models\Country;
use App\Models\Destination;
use App\Models\Hotel;
use App\Models\Restaurant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExploreTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_list_destinations_with_country_loaded(): void
    {
        $country = Country::factory()->create(['name' => 'Spain']);
        Destination::factory()->count(2)->create(['country_id' => $country->id]);

        $response = $this->getJson('/api/v1/destinations');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.country.name', 'Spain');

        $this->assertTrue($response->json('data.0.country_id') === $country->id);
    }

    public function test_guest_can_show_single_destination_with_country_loaded(): void
    {
        $country = Country::factory()->create(['name' => 'Italy']);
        $destination = Destination::factory()->create([
            'country_id' => $country->id,
            'name' => 'Rome',
        ]);

        $response = $this->getJson("/api/v1/destinations/{$destination->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Rome')
            ->assertJsonPath('data.country.name', 'Italy');
    }

    public function test_guest_can_list_hotels_with_pagination_meta(): void
    {
        Hotel::factory()->count(11)->create();

        $response = $this->getJson('/api/v1/hotels');

        $response->assertStatus(200)
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.total', 11)
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.last_page', 2);
    }

    public function test_guest_can_show_single_hotel(): void
    {
        $hotel = Hotel::factory()->create(['name' => 'Grand Palace Hotel']);

        $this->getJson("/api/v1/hotels/{$hotel->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Grand Palace Hotel');
    }

    public function test_guest_can_list_restaurants_with_relations(): void
    {
        Restaurant::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/restaurants');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');

        foreach ($response->json('data') as $restaurant) {
            $this->assertArrayHasKey('category', $restaurant);
            $this->assertArrayHasKey('destination', $restaurant);
        }
    }

    public function test_guest_can_show_single_restaurant(): void
    {
        $restaurant = Restaurant::factory()->create(['name' => 'Olive Garden']);

        $this->getJson("/api/v1/restaurants/{$restaurant->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Olive Garden');
    }

    public function test_guest_can_list_attractions(): void
    {
        Attraction::factory()->count(3)->create();

        $this->getJson('/api/v1/attractions')
            ->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_guest_can_show_single_attraction(): void
    {
        $attraction = Attraction::factory()->create(['name' => 'Pyramids of Giza']);

        $this->getJson("/api/v1/attractions/{$attraction->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Pyramids of Giza');
    }

    public function test_public_explore_routes_do_not_require_authentication(): void
    {
        $this->getJson('/api/v1/categories')->assertStatus(200);
        $this->getJson('/api/v1/destinations')->assertStatus(200);
        $this->getJson('/api/v1/hotels')->assertStatus(200);
        $this->getJson('/api/v1/restaurants')->assertStatus(200);
        $this->getJson('/api/v1/attractions')->assertStatus(200);
    }
}