<?php

namespace App\Services\Fixtures;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HotelFixtureService
{
    public function sync(int $limit = 20): array
    {
        $apiKey = config('services.rapidapi.key');
        $host = config('services.rapidapi.hotels_host');

        if (!$apiKey) {
            throw new \Exception("RapidAPI Key is not configured.");
        }

        try {
            // Mock Location ID for Paris (293919) as a query standard or loop targets
            $response = Http::withHeaders([
                'X-RapidAPI-Key' => $apiKey,
                'X-RapidAPI-Host' => $host,
            ])->timeout(15)->get("https://{$host}/hotels/list", [
                'location_id' => '293919',
                'limit' => $limit,
            ]);

            if (!$response->successful()) {
                throw new \Exception("RapidAPI Hotels returned status: " . $response->status());
            }

            $data = $response->json()['data'] ?? [];
            $hotels = [];

            foreach ($data as $item) {
                if (isset($item['name'])) {
                    $hotels[] = [
                        'name' => $item['name'],
                        'price' => isset($item['price']) ? (float) preg_replace('/[^0-9.]/', '', $item['price']) : 150.00,
                        'rating' => isset($item['rating']) ? (float) $item['rating'] : 4.0,
                        'stars' => isset($item['hotel_class']) ? (int) $item['hotel_class'] : 4,
                        'image' => $item['photo']['images']['large']['url'] ?? 'hotels/default.jpg'
                    ];
                }
            }

            return $hotels;
        } catch (\Exception $e) {
            Log::warning("HotelFixtureService failed: " . $e->getMessage());
            throw $e;
        }
    }
}
