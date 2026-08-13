<?php

namespace App\Services\Catalog\Fixtures;

use App\Models\Catalog\Destination;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RestaurantFixtureService
{
    public function sync(?int $limit = null, ?\Closure $progressCallback = null): array
    {
        $apiKey = config('services.rapidapi.key');
        $host = config('services.rapidapi.restaurants_host');

        if (! $apiKey) {
            throw new \Exception('RapidAPI Key is not configured.');
        }

        // Get all destinations currently in the database
        $destinations = Destination::all();
        if ($destinations->isEmpty()) {
            Log::warning('No destinations found in database. Cannot sync restaurants.');

            return [];
        }

        $allRestaurants = [];

        foreach ($destinations as $index => $destination) {
            // Apply delay to be polite to rate limits
            if ($index > 0) {
                usleep(500000); // 0.5s delay
            }

            try {
                // Use destination latitude/longitude if available, or fall back to Paris location ID
                $queryParams = [
                    'limit' => $limit ?? 10,
                ];

                if ($destination->latitude && $destination->longitude) {
                    $queryParams['latitude'] = $destination->latitude;
                    $queryParams['longitude'] = $destination->longitude;
                } else {
                    $queryParams['location_id'] = '293919'; // Paris fallback
                }

                $response = Http::withHeaders([
                    'X-RapidAPI-Key' => $apiKey,
                    'X-RapidAPI-Host' => $host,
                ])->timeout(15)->get("https://{$host}/restaurants/list", $queryParams);

                if (! $response->successful()) {
                    Log::warning("RapidAPI Restaurants failed for destination {$destination->name}: ".$response->status());
                    if ($progressCallback) {
                        $progressCallback();
                    }

                    continue;
                }

                $data = $response->json()['data'] ?? [];
                foreach ($data as $item) {
                    if (isset($item['name'])) {
                        $allRestaurants[] = [
                            'name' => $item['name'],
                            'cuisine' => $item['cuisine'][0]['name'] ?? 'Local',
                            'price_range' => $item['price_level'] ?? '$$',
                            'rating' => isset($item['rating']) ? (float) $item['rating'] : 4.0,
                            'image' => $item['photo']['images']['large']['url'] ?? 'restaurants/default.jpg',
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::warning("RestaurantFixtureService failed for destination {$destination->name}: ".$e->getMessage());
            }

            if ($progressCallback) {
                $progressCallback();
            }
        }

        return $allRestaurants;
    }
}
