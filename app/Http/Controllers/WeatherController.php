<?php

namespace App\Http\Controllers;

use App\Services\OpenMeteoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class WeatherController extends Controller
{
    protected $weatherService;

    public function __class(OpenMeteoService $weatherService)
    {
        $this->weatherService = $weatherService;
    }

    public function show(Request $request)
    {
        $request->validate([
            'lat' => 'required|numeric',
            'lon' => 'required|numeric',
        ]);

        $lat = $request->query('lat');
        $lon = $request->query('lon');
        
        // Cache the weather data for 15 minutes to stay well within free tier limits
        $cacheKey = "weather_{$lat}_{$lon}";
        
        $weatherData = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($lat, $lon) {
            return $this->weatherService->getWeather($lat, $lon);
        });

        if (!$weatherData) {
            return response()->json(['error' => 'Unable to fetch weather data'], 500);
        }

        return response()->json($weatherData);
    }
}