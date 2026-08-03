<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Sprint1IntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_fady_trips()
    {
        $response1 = $this->getJson('/api/trips');
        $response2 = $this->getJson('/api/v1/trips/create');
        
        $this->assertTrue($response1->status() !== 404 || $response2->status() !== 404, 'Trips endpoint missing entirely');
    }

    public function test_kenzy_destinations_hotels()
    {
        $response = $this->getJson('/api/v1/destinations');
        $this->assertNotEquals(404, $response->status(), 'Destinations missing at /api/v1/destinations');
        
        $response = $this->getJson('/api/v1/hotels');
        $this->assertNotEquals(404, $response->status(), 'Hotels missing at /api/v1/hotels');
    }

    public function test_rana_categories()
    {
        $response = $this->getJson('/api/v1/categories');
        $this->assertNotEquals(404, $response->status(), 'Categories missing at /api/v1/categories');
        
        // Admin route requires auth, but if it exists, it returns 401 Unauthenticated instead of 404.
        $response = $this->getJson('/api/v1/admin/categories');
        $this->assertNotEquals(404, $response->status(), 'Admin categories missing at /api/v1/admin/categories');
    }
}
