<?php

namespace App\Services\Fixtures;

use App\Models\Destination;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HotelFixtureService
{
    public function sync(?int $limit = null, ?\Closure $progressCallback = null): array
    {
        $apiKey = config('services.rapidapi.key');
        $host = config('services.rapidapi.hotels_host');

        if (! $apiKey) {
            throw new \Exception('RapidAPI Key is not configured.');
        }

        // Get all destinations currently in the database
        $destinations = Destination::all();
        if ($destinations->isEmpty()) {
            Log::warning('No destinations found in database. Cannot sync hotels.');

            return [];
        }

        $allHotels = [];

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
                ])->timeout(15)->get("https://{$host}/hotels/list", $queryParams);

                if (! $response->successful()) {
                    Log::warning("RapidAPI Hotels failed for destination {$destination->name}: ".$response->status());
                    if ($progressCallback) {
                        $progressCallback();
                    }

                    continue;
                }

                $data = $response->json()['data'] ?? [];
                foreach ($data as $item) {
                    if (isset($item['name'])) {
                        $allHotels[] = [
                            'name' => $item['name'],
                            'price' => isset($item['price']) ? (float) preg_replace('/[^0-9.]/', '', $item['price']) : 150.00,
                            'rating' => isset($item['rating']) ? (float) $item['rating'] : 4.0,
                            'stars' => isset($item['hotel_class']) ? (int) $item['hotel_class'] : 4,
                            'image' => $item['photo']['images']['large']['url'] ?? 'hotels/default.jpg',
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::warning("HotelFixtureService failed for destination {$destination->name}: ".$e->getMessage());
            }

            if ($progressCallback) {
                $progressCallback();
            }
        }

        return $allHotels;
    }
}
