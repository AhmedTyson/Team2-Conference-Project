<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenMeteoService
{
    public function getWeather(float $latitude, float $longitude): ?array
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
                    'daily' => 'temperature_2m_max,temperature_2m_min,weathercode',
                    'timezone' => 'auto',
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $normalized = $this->normalizeWeatherData($data, $latitude, $longitude);

                Cache::put($key, $normalized, now()->addMinutes(30));

                return $normalized;
            }

            // Log error if Open-Meteo returns a non-200 status code
            Log::error('OpenMeteo API Error: '.$response->body());

        } catch (\Exception $e) {
            // Log any cURL or connection exception
            Log::error('OpenMeteo Exception: '.$e->getMessage());
        }

        // Fallback weather telemetry if external service is unreachable
        return $this->getFallbackWeather($latitude, $longitude);
    }

    protected function normalizeWeatherData(array $data, float $latitude, float $longitude): array
    {
        $cw = $data['current_weather'] ?? [];

        $temp = $cw['temperature'] ?? 22.0;
        $code = $cw['weathercode'] ?? 0;
        $speed = $cw['windspeed'] ?? 10.0;
        $dir = $cw['winddirection'] ?? 180;

        return array_merge($data, [
            'latitude' => $data['latitude'] ?? $latitude,
            'longitude' => $data['longitude'] ?? $longitude,
            'current_weather' => $cw,
            'daily' => $data['daily'] ?? null,
            'temperature' => $temp,
            'weathercode' => $code,
            'windspeed' => $speed,
            'winddirection' => $dir,
            'is_fallback' => false,
        ]);
    }

    protected function getFallbackWeather(float $latitude, float $longitude): array
    {
        $baseTemp = round(30 - (abs($latitude) * 0.3), 1);

        $cw = [
            'time' => now()->toIso8601String(),
            'temperature' => $baseTemp,
            'windspeed' => 12.0,
            'winddirection' => 180,
            'weathercode' => 1,
            'is_day' => 1,
        ];

        return [
            'latitude' => $latitude,
            'longitude' => $longitude,
            'current_weather' => $cw,
            'daily' => null,
            'temperature' => $baseTemp,
            'weathercode' => 1,
            'windspeed' => 12.0,
            'winddirection' => 180,
            'is_fallback' => true,
        ];
    }
}
