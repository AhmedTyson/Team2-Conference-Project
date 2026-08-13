<?php

namespace Tests\Feature\System;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WeatherCacheTest extends TestCase
{
    use RefreshDatabase;

    public function test_weather_response_is_cached_per_coordinates(): void
    {
        Cache::flush();

        Http::fake([
            'api.open-meteo.com/*' => Http::response([
                'current_weather' => ['temperature' => 25.0],
            ], 200),
        ]);

        $first = $this->getJson('/api/weather?lat=30.0444&lon=31.2357');
        $second = $this->getJson('/api/weather?lat=30.0444&lon=31.2357');

        $first->assertOk()->assertJson(['current_weather' => ['temperature' => 25.0]]);
        $second->assertOk()->assertJson(['current_weather' => ['temperature' => 25.0]]);

        Http::assertSentCount(1);
        $this->assertTrue(Cache::has('weather:30.0444|31.2357'));
    }

    public function test_different_coordinates_are_cached_independently(): void
    {
        Cache::flush();

        Http::fake([
            'api.open-meteo.com/*' => Http::sequence()
                ->push(['location' => 'cairo'], 200)
                ->push(['location' => 'alex'], 200),
        ]);

        $this->getJson('/api/weather?lat=30.0444&lon=31.2357')->assertOk();
        $this->getJson('/api/weather?lat=31.2001&lon=29.9187')->assertOk();

        Http::assertSentCount(2);
    }

    public function test_failed_weather_call_is_not_cached_and_retried(): void
    {
        Cache::flush();

        Http::fake([
            'api.open-meteo.com/*' => Http::sequence()
                ->push(['current_weather' => ['temperature' => 30.0]], 200),
        ]);

        $this->getJson('/api/weather?lat=30.0444&lon=31.2357')->assertOk();
        $this->getJson('/api/weather?lat=30.0444&lon=31.2357')
            ->assertOk()
            ->assertJson(['current_weather' => ['temperature' => 30.0]]);

        Http::assertSentCount(1);
    }
}
