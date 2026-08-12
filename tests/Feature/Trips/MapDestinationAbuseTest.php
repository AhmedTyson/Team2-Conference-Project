<?php

namespace Tests\Feature\Trips;

use App\Jobs\GeocodeDestinationJob;
use App\Models\Catalog\Destination;
use App\Services\Catalog\Fixtures\OpenStreetService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class MapDestinationAbuseTest extends TestCase
{
    use RefreshDatabase;

    protected function fakeExternalServices(): void
    {
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response([
                ['lat' => '30.0444', 'lon' => '31.2357'],
            ], 200),
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

    public function test_maps_destination_endpoint_is_throttled(): void
    {
        Cache::flush();
        $this->fakeExternalServices();
        Queue::fake();

        $destination = Destination::factory()->create([
            'name' => 'Cairo',
            'city_name' => 'Cairo',
            'latitude' => 30.0444,
            'longitude' => 31.2357,
        ]);

        for ($i = 0; $i < 10; $i++) {
            $this->getJson("/api/v1/maps/destination/{$destination->id}")->assertOk();
        }

        $this->getJson("/api/v1/maps/destination/{$destination->id}")
            ->assertStatus(429);
    }

    public function test_get_does_not_mutate_destination_and_dispatches_backfill_job(): void
    {
        Cache::flush();
        $this->fakeExternalServices();
        Queue::fake();

        $destination = Destination::factory()->create([
            'name' => 'Cairo',
            'city_name' => 'Cairo',
            'latitude' => null,
            'longitude' => null,
        ]);

        $response = $this->getJson("/api/v1/maps/destination/{$destination->id}");

        $response->assertOk()->assertJson(['success' => true]);

        // GET stays pure: no coordinates were written by the request itself.
        $fresh = $destination->fresh();
        $this->assertNull($fresh->latitude);
        $this->assertNull($fresh->longitude);

        // Enrichment was delegated to the background job instead.
        Queue::assertPushed(GeocodeDestinationJob::class);

        // Without coordinates, nearby places are not fetched; city data still works.
        $response->assertJsonPath('data.hotels', [])
            ->assertJsonPath('data.restaurants', [])
            ->assertJsonPath('data.attractions.0.name', 'Citadel');
    }

    public function test_repeated_gets_do_not_repeat_external_calls(): void
    {
        Cache::flush();
        $this->fakeExternalServices();
        Queue::fake();

        $destination = Destination::factory()->create([
            'name' => 'Cairo',
            'city_name' => 'Cairo',
            'latitude' => 30.0444,
            'longitude' => 31.2357,
        ]);

        $this->getJson("/api/v1/maps/destination/{$destination->id}")->assertOk();
        $this->getJson("/api/v1/maps/destination/{$destination->id}")->assertOk();

        // 1 OpenAI + 2 Overpass on first request; cache serves the second.
        Http::assertSentCount(3);
    }

    public function test_geocode_job_backfills_coordinates(): void
    {
        Cache::flush();
        $this->fakeExternalServices();

        $destination = Destination::factory()->create([
            'name' => 'Cairo',
            'city_name' => 'Cairo',
            'latitude' => null,
            'longitude' => null,
        ]);

        (new GeocodeDestinationJob($destination))->handle(app(OpenStreetService::class));

        $fresh = $destination->fresh();
        $this->assertEquals(30.0444, $fresh->latitude);
        $this->assertEquals(31.2357, $fresh->longitude);
    }

    public function test_nominatim_request_has_explicit_timeout_protection(): void
    {
        Cache::flush();

        // First attempt fails (simulates a hung/slow upstream), retry succeeds.
        $attempt = 0;
        Http::fake([
            'nominatim.openstreetmap.org/*' => function ($request) use (&$attempt) {
                $attempt++;

                if ($attempt === 1) {
                    throw new \Illuminate\Http\Client\ConnectionException('Connection timed out');
                }

                return Http::response([
                    ['lat' => '30.0444', 'lon' => '31.2357'],
                ], 200);
            },
        ]);

        $maps = app(OpenStreetService::class);
        $coords = $maps->getCoordinates('Cairo, Cairo');

        $this->assertEquals(30.0444, $coords['lat']);
        $this->assertEquals(31.2357, $coords['lng']);

        // The first attempt failed and the retry ran again (attempt 2),
        // proving the request is bounded to two attempts. The successful
        // request carries the required User-Agent.
        $this->assertEquals(2, $attempt);
        Http::assertSentCount(1);
        Http::assertSent(function ($request) {
            if (! str_contains($request->url(), 'nominatim.openstreetmap.org')) {
                return true;
            }

            return $request->hasHeader('User-Agent');
        });
    }
}
