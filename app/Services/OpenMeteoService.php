<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenMeteoService
{
    public function getWeather(float $latitude, float $longitude)
    {
        try {
            // Open-Meteo requires latitude & longitude as query parameter names
            $response = Http::withoutVerifying()->get('https://api.open-meteo.com/v1/forecast', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'current_weather' => true,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            // Log error if Open-Meteo returns a non-200 status code
            Log::error('OpenMeteo API Error: ' . $response->body());
            return null;

        } catch (\Exception $e) {
            // Log any cURL or connection exception
            Log::error('OpenMeteo Exception: ' . $e->getMessage());
            return null;
        }
    }
}