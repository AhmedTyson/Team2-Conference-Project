<?php

namespace App\Services\Catalog\Fixtures;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenStreetService
{
    protected string $userAgent = 'Itinera/1.0 (fady11336@gmail.com)';

    public function getCoordinates(string $address): ?array
    {
        return Cache::remember(
            'osm:coords:'.md5($address),
            now()->addHours(24),
            function () use ($address) {
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
        );
    }

    public function getNearbyPlaces(float $lat, float $lng, string $type, int $radius = 2000): array
    {
        $cacheKey = 'osm:places:'.md5(implode('|', [$lat, $lng, $type, $radius]));

        return Cache::remember($cacheKey, now()->addHours(8), function () use ($lat, $lng, $type, $radius) {
            $query = match ($type) {

                'restaurant' => "
        [out:json][timeout:5];
        (
          node[amenity=restaurant](around:$radius,$lat,$lng);
          node[amenity=fast_food](around:$radius,$lat,$lng);
          node[amenity=cafe](around:$radius,$lat,$lng);
        );
        out;
        ",

                'lodging' => "
        [out:json][timeout:5];
        (
          node[tourism=hotel](around:$radius,$lat,$lng);
          node[tourism=hostel](around:$radius,$lat,$lng);
          node[tourism=guest_house](around:$radius,$lat,$lng);
        );
        out;
        ",

                'tourist_attraction' => "
        [out:json][timeout:5];
        (
          node[tourism=attraction](around:$radius,$lat,$lng);
          node[tourism=museum](around:$radius,$lat,$lng);
          node[tourism=monument](around:$radius,$lat,$lng);
          node[historic=monument](around:$radius,$lat,$lng);
          node[historic=archaeological_site](around:$radius,$lat,$lng);
        );
        out;
        ",
            };

            Log::info('START: '.$type);

            $response = Http::connectTimeout(3)
                ->timeout(5)
                ->withHeaders([
                    'User-Agent' => $this->userAgent,
                ])
                ->asForm()
                ->post(
                    'https://overpass-api.de/api/interpreter',
                    ['data' => $query]
                );

            Log::info('END: '.$type.' '.$response->status());

            if (! $response->successful()) {
                Log::error('Overpass failed', [
                    'type' => $type,
                    'status' => $response->status(),
                ]);

                return [];
            }

            return collect($response->json('elements', []))
                ->map(function ($place) {

                    return [
                        'name' => $place['tags']['name'] ?? null,
                        'lat' => $place['lat'] ?? ($place['center']['lat'] ?? null),
                        'lng' => $place['lon'] ?? ($place['center']['lon'] ?? null),
                    ];

                })
                ->filter(function ($place) {

                    return
                        ! empty($place['name']) &&
                        ! is_null($place['lat']) &&
                        ! is_null($place['lng']);

                })
                ->unique('name')
                ->values()
                ->unique('name')
                ->values()
                ->take(20)
                ->toArray();
        });
    }

    public function getDirections(array $origin, array $destination, array $waypoints = []): array
    {
        // OSRM بياخد الإحداثيات بترتيب lng,lat (مش lat,lng زي المعتاد!)
        $coordinates = collect([$origin, ...$waypoints, $destination])
            ->map(fn ($point) => "{$point['lng']},{$point['lat']}")
            ->implode(';');

        Log::info('Coordinates: '.$coordinates);

        return Cache::remember(
            'osm:directions:'.md5($coordinates),
            now()->addMinutes(60),
            function () use ($coordinates) {

                $response = Http::withHeaders(['User-Agent' => $this->userAgent])
                    ->get("https://router.project-osrm.org/route/v1/driving/{$coordinates}", [
                        'overview' => 'full',
                        'geometries' => 'geojson',
                    ]);

                Log::info('Status: '.$response->status());
                Log::info('Body: '.$response->body());

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
        );
    }

    public function getAttractionsWithAI(string $city): array
    {
        return Cache::remember(
            'osm:attractions_ai:'.md5($city),
            now()->addHours(24),
            function () use ($city) {
                Log::info('AI attractions called: '.$city);
                $response = Http::retry(2, 1000)->connectTimeout(5)
                    ->timeout(15)
                    ->withToken(config('services.openai.key'))
                    ->post(
                        'https://api.openai.com/v1/chat/completions',
                        [
                            'model' => 'gpt-4.1-mini',
                            'messages' => [
                                [
                                    'role' => 'system',
                                    'content' => 'Return only valid JSON.',
                                ],
                                [
                                    'role' => 'user',
                                    'content' => "Give me exactly 10 tourist attractions in {$city}.

            Return ONLY a JSON array.
            No markdown.
            No explanation.

            Format:
            [
            {
            \"name\": \"Pyramids of Giza\",
            \"lat\": 29.9792,
            \"lng\": 31.1342
            }
            ]",
                                ],
                            ],
                        ]
                    );

                if ($response->failed()) {
                    return [];
                }

                $content = $response->json('choices.0.message.content');

                Log::info('AI RESPONSE: '.$content);

                $content = preg_replace('/^```json\s*|\s*```$/', '', trim($content));

                $data = json_decode($content, true);

                if (! is_array($data)) {
                    Log::error('AI JSON ERROR: '.$content);

                    return [];
                }

                return $data;
            }
        );
    }
}
