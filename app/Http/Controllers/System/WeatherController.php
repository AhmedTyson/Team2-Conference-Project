<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\ShowWeatherRequest;
use App\Services\OpenMeteoService;
use App\Support\ApiResponse;

class WeatherController extends Controller
{
    protected $weatherService;

    public function __construct(OpenMeteoService $weatherService)
    {
        $this->weatherService = $weatherService;
    }

    public function show(ShowWeatherRequest $request)
    {
        $lat = (float) $request->input('lat');
        $lon = (float) $request->input('lon');

        $weatherData = $this->weatherService->getWeather($lat, $lon);

        if (! $weatherData) {
            return ApiResponse::fail(
                'Unable to fetch weather data',
                'weather_unavailable',
                502
            );
        }

        return response()->json($weatherData);
    }
}
