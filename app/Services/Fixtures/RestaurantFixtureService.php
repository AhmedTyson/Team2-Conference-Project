<?php

namespace App\Services\Fixtures;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RestaurantFixtureService
{
    public function sync(int $limit = 20): array
    {
        $apiKey = config('services.rapidapi.key');
        $host = config('services.rapidapi.restaurants_host');

        if (!$apiKey) {
            throw new \Exception("RapidAPI Key is not configured.");
        }

        try {
            $response = Http::withHeaders([
                'X-RapidAPI-Key' => $apiKey,
                'X-RapidAPI-Host' => $host,
            ])->timeout(15)->get("https://{$host}/restaurants/list", [
                'location_id' => '293919',
                'limit' => $limit,
            ]);

            if (!$response->successful()) {
                throw new \Exception("RapidAPI Restaurants returned status: " . $response->status());
            }

            $data = $response->json()['data'] ?? [];
            $restaurants = [];

            foreach ($data as $item) {
                if (isset($item['name'])) {
                    $restaurants[] = [
                        'name' => $item['name'],
                        'cuisine' => $item['cuisine'][0]['name'] ?? 'Local',
                        'price_range' => $item['price_level'] ?? '$$',
                        'rating' => isset($item['rating']) ? (float) $item['rating'] : 4.0,
                        'image' => $item['photo']['images']['large']['url'] ?? 'restaurants/default.jpg'
                    ];
                }
            }

            return $restaurants;
        } catch (\Exception $e) {
            Log::warning("RestaurantFixtureService failed: " . $e->getMessage());
            throw $e;
        }
    }
}
