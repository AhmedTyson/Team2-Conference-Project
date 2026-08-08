<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Sprint1IntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_sarah_lojy_auth_endpoints()
    {
        $response = $this->postJson('/api/register', []);
        $this->assertNotEquals(404, $response->status(), 'Sarah: Register missing');

        $response = $this->postJson('/api/forgot-password', []);
        $this->assertNotEquals(404, $response->status(), 'Sarah: Forgot password missing');
    }

    public function test_sama_surveys()
    {
        $response = $this->getJson('/api/surveys');
        $this->assertNotEquals(404, $response->status(), 'Sama: Surveys missing');
    }

    public function test_fady_trips()
    {
        $response = $this->getJson('/api/v1/trips/create');
        $this->assertNotEquals(404, $response->status(), 'Fady: Trips create missing');
    }

    public function test_adham_trip_attachments()
    {
        // Attach endpoint now exists (built in Sprint 1). Verify it resolves and requires auth.
        $response = $this->postJson('/api/v1/trips/1/attach/hotel');
        $this->assertEquals(401, $response->status(), 'Adham: Attach endpoint requires authentication');
    }

    public function test_kenzy_destinations_hotels()
    {
        $response = $this->getJson('/api/v1/destinations');
        $this->assertNotEquals(404, $response->status(), 'Kenzy: Destinations missing');

        $response = $this->getJson('/api/v1/hotels');
        $this->assertNotEquals(404, $response->status(), 'Kenzy: Hotels missing');
    }

    public function test_hana_restaurants_attractions()
    {
        $response = $this->getJson('/api/v1/restaurants');
        $this->assertNotEquals(404, $response->status(), 'Hana: Restaurants missing');

        $response = $this->getJson('/api/v1/attractions');
        $this->assertNotEquals(404, $response->status(), 'Hana: Attractions missing');
    }

    public function test_rana_categories()
    {
        $response = $this->getJson('/api/v1/categories');
        $this->assertNotEquals(404, $response->status(), 'Rana: Categories missing');
    }
}
