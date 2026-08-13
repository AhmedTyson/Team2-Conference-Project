<?php

namespace Tests\Feature\System;

use App\Services\OpenMeteoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WeatherAbuseTest extends TestCase
{
    use RefreshDatabase;

    public function test_weather_endpoint_is_throttled_per_ip(): void
    {
        Cache::flush();

        Http::fake([
            'api.open-meteo.com/*' => Http::response([
                'current_weather' => ['temperature' => 25.5],
            ], 200),
        ]);

        for ($i = 0; $i < 30; $i++) {
            $this->getJson('/api/weather?lat=30.0444&lon=31.2357')->assertOk();
        }

        $this->getJson('/api/weather?lat=30.0444&lon=31.2357')
            ->assertStatus(429);
    }

    public function test_weather_still_serves_cache_within_limit(): void
    {
        Cache::flush();

        Http::fake([
            'api.open-meteo.com/*' => Http::response([
                'current_weather' => ['temperature' => 25.5],
            ], 200),
        ]);

        $first = $this->getJson('/api/weather?lat=30.0444&lon=31.2357');
        $first->assertOk();

        Http::assertSentCount(1);

        $second = $this->getJson('/api/weather?lat=30.0444&lon=31.2357');
        $second->assertOk();

        // Cache serves the repeat — no external call.
        Http::assertSentCount(1);
    }
}