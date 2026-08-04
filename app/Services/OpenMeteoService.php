<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenMeteoService
{
    /**
     * Fetch current weather and 7-day forecast.
     */
    public function getWeather(float $latitude, float $longitude): ?array
    {
        try {
            // No API key required for the free tier endpoint
            $response = Http::get('https://open-meteo.com', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'current' => 'temperature_2m,wind_speed_10m,weather_code',
                'hourly' => 'temperature_2m,relative_humidity_2m',
                'timezone' => 'auto'
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Open-Meteo API Error: ' . $response->body());
            return null;

        } catch (\Exception $e) {
            Log::error('Open-Meteo Connection Error: ' . $e->getMessage());
            return null;
        }
    }
}
