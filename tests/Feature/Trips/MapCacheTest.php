<?php

namespace Tests\Feature\Trips;

use App\Models\Catalog\Destination;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MapCacheTest extends TestCase
{
    use RefreshDatabase;

    protected function fakeExternalServices(): void
    {
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    ['message' => ['content' => '[{"name":"Citadel","lat":30.0,"lng":31.2}]']],
                ],
            ], 200),
            'overpass-api.de/*' => Http::response([
                'elements' => [[
                    'tags' => ['name' => 'Test Place'],
                    'lat' => 30.0,
                    'lon' => 31.2,
                ]],
            ], 200),
        ]);
    }

    public function test_map_destination_calls_external_apis_once_then_serves_from_cache(): void
    {
        Cache::flush();
        $this->fakeExternalServices();

        $destination = Destination::factory()->create([
            'name' => 'Cairo',
            'city_name' => 'Cairo',
            'latitude' => 30.0444,
            'longitude' => 31.2357,
        ]);

        $first = $this->getJson("/api/v1/maps/destination/{$destination->id}");
        $second = $this->getJson("/api/v1/maps/destination/{$destination->id}");

        $first->assertOk()->assertJson(['success' => true]);
        $second->assertOk()->assertJson(['success' => true]);

        // 1 OpenAI call + 2 Overpass calls, never repeated
        Http::assertSentCount(3);

        $this->assertTrue(
            Cache::has('osm:attractions_ai:'.md5($destination->city_name))
        );
    }

    public function test_map_attractions_are_cached_per_city(): void
    {
        Cache::flush();
        $this->fakeExternalServices();

        $cairo = Destination::factory()->create([
            'name' => 'Cairo',
            'city_name' => 'Cairo',
            'latitude' => 30.0444,
            'longitude' => 31.2357,
        ]);
        $alex = Destination::factory()->create([
            'name' => 'Alexandria',
            'city_name' => 'Alexandria',
            'latitude' => 31.2001,
            'longitude' => 29.9187,
        ]);

        $this->getJson("/api/v1/maps/destination/{$cairo->id}")->assertOk();
        $this->getJson("/api/v1/maps/destination/{$alex->id}")->assertOk();

        $this->assertTrue(Cache::has('osm:attractions_ai:'.md5('Cairo')));
        $this->assertTrue(Cache::has('osm:attractions_ai:'.md5('Alexandria')));
    }
}
