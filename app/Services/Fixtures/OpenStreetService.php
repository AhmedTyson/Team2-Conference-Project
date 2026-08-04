<?php

namespace App\Services\Fixtures;

use Illuminate\Support\Facades\Http;

class OpenStreetService
{
    protected string $userAgent = 'Itinera/1.0 (fady11336@gmail.com)'; 

    public function getCoordinates(string $address): ?array
    {
        $response = Http::withHeaders(['User-Agent' => $this->userAgent])
            ->get('https://nominatim.openstreetmap.org/search', [
                'q' => $address,
                'format' => 'json',
                'limit' => 1,
            ]);

        $result = $response->json('0');

        return $result ? [
            'lat' => (float) $result['lat'],
            'lng' => (float) $result['lon'],
        ] : null;
    }

    public function getNearbyPlaces(float $lat, float $lng, string $type, int $radius = 5000): array
    {
        $osmTag = match ($type) {
            'lodging' => 'tourism=hotel',
            'restaurant' => 'amenity=restaurant',
            'tourist_attraction' => 'tourism=attraction',
            default => 'tourism=attraction',
        };

        $query = "[out:json];node[$osmTag](around:$radius,$lat,$lng);out body 20;";

        $response = Http::withHeaders(['User-Agent' => $this->userAgent])
            ->asForm()
            ->post('https://overpass-api.de/api/interpreter', ['data' => $query]);

        return collect($response->json('elements', []))
            ->map(fn ($place) => [
                'name' => $place['tags']['name'] ?? 'Unnamed',
                'lat' => $place['lat'],
                'lng' => $place['lon']
            ])
            ->values()
            ->toArray();
    }
    public function getDirections(array $origin, array $destination, array $waypoints = []): array
{
    // OSRM بياخد الإحداثيات بترتيب lng,lat (مش lat,lng زي المعتاد!)
    $coordinates = collect([$origin, ...$waypoints, $destination])
        ->map(fn ($point) => "{$point['lng']},{$point['lat']}")
        ->implode(';');

    $response = Http::withHeaders(['User-Agent' => $this->userAgent])
        ->get("https://router.project-osrm.org/route/v1/driving/{$coordinates}", [
            'overview' => 'full',
            'geometries' => 'geojson',
        ]);

    if ($response->failed() || $response->json('code') !== 'Ok') {
        return [];
    }

    $route = $response->json('routes.0');

    return [
        'distance_km' => round($route['distance'] / 1000, 2),
        'duration_minutes' => round($route['duration'] / 60, 2),
        'geometry' => $route['geometry'], // خط المسار على الخريطة (GeoJSON)
    ];
}
    
}