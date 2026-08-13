<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenMeteoService
{
    public function getWeather(float $latitude, float $longitude)
    {
        $key = 'weather:'.sprintf('%0.4f|%0.4f', $latitude, $longitude);

        $cached = Cache::get($key);

        if ($cached !== null) {
            return $cached;
        }

        try {
            // Open-Meteo requires latitude & longitude as query parameter names
            $response = Http::timeout(config('services.open-meteo.timeout', 5))
                ->connectTimeout(config('services.open-meteo.connect_timeout', 3))
                ->get('https://api.open-meteo.com/v1/forecast', [
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'current_weather' => true,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                Cache::put($key, $data, now()->addMinutes(30));

                return $data;
            }

            // Log error if Open-Meteo returns a non-200 status code
            Log::error('OpenMeteo API Error: '.$response->body());

            return null;

        } catch (\Exception $e) {
            // Log any cURL or connection exception
            Log::error('OpenMeteo Exception: '.$e->getMessage());

            return null;
        }
    }
}
