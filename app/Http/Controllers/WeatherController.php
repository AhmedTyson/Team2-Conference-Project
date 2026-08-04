<?php

namespace App\Http\Controllers;

use App\Services\OpenMeteoService;
use Illuminate\Http\Request;

class WeatherController extends Controller
{
    protected $weatherService;

    public function __construct(OpenMeteoService $weatherService)
    {
        $this->weatherService = $weatherService;
    }

    public function show(Request $request)
    {
        $request->validate([
            'lat' => 'required|numeric',
            'lon' => 'required|numeric',
        ]);

        $lat = (float) $request->input('lat');
        $lon = (float) $request->input('lon');
        
        $weatherData = $this->weatherService->getWeather($lat, $lon);

        if (!$weatherData) {
            return response()->json(['error' => 'Unable to fetch weather data'], 500);
        }

        return response()->json($weatherData);
    }
}