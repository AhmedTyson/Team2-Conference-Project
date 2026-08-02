<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class FetchRawTravelData extends Command
{
    protected $signature = 'fetch:raw-travel-data';
    protected $description = 'Fetch fresh hotel, flight, and restaurant data from RapidAPI and update local JSON fixtures.';

    public function handle()
    {
        $this->info('Starting fresh API data fetch...');

        $rapidApiKey = config('services.rapidapi.key');
        if (!$rapidApiKey) {
            $this->error('RapidAPI Key not found in config/services.php or .env!');
            return 1;
        }

        $headers = [
            'X-RapidAPI-Key' => $rapidApiKey,
            'X-RapidAPI-Host' => 'travel-advisor.p.rapidapi.com' // Example host, adjust as needed
        ];

        // 1. Fetch Hotels
        $this->info('Fetching Hotels...');
        $hotelResponse = Http::withHeaders($headers)
            ->get('https://travel-advisor.p.rapidapi.com/hotels/list', [
                'location_id' => '293919', // Example Location ID (Paris)
                'limit' => '10',
            ]);

        if ($hotelResponse->successful()) {
            $hotels = [];
            $data = $hotelResponse->json()['data'] ?? [];
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
            file_put_contents(
                database_path('seeders/fixtures/hotels.json'),
                json_encode($hotels, JSON_PRETTY_PRINT)
            );
            $this->info('Successfully updated hotels.json');
        } else {
            $this->error('Failed to fetch hotels from RapidAPI.');
        }

        // 2. Fetch Restaurants
        $this->info('Fetching Restaurants...');
        $restaurantResponse = Http::withHeaders($headers)
            ->get('https://travel-advisor.p.rapidapi.com/restaurants/list', [
                'location_id' => '293919',
                'limit' => '10',
            ]);

        if ($restaurantResponse->successful()) {
            $restaurants = [];
            $data = $restaurantResponse->json()['data'] ?? [];
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
            file_put_contents(
                database_path('seeders/fixtures/restaurants.json'),
                json_encode($restaurants, JSON_PRETTY_PRINT)
            );
            $this->info('Successfully updated restaurants.json');
        } else {
            $this->error('Failed to fetch restaurants from RapidAPI.');
        }

        // 3. Fetch Flights (Mock flight search API)
        $this->info('Fetching Flights...');
        // We simulate a stable response mapping from the mock/flight search API
        $flights = [
            [
                'departure_airport' => 'JFK',
                'arrival_airport' => 'CDG',
                'departure_date' => now()->addDays(30)->format('Y-m-d 18:30:00'),
                'arrival_date' => now()->addDays(31)->format('Y-m-d 07:45:00'),
                'price' => 650.00
            ],
            [
                'departure_airport' => 'LHR',
                'arrival_airport' => 'HND',
                'departure_date' => now()->addDays(45)->format('Y-m-d 12:00:00'),
                'arrival_date' => now()->addDays(46)->format('Y-m-d 09:30:00'),
                'price' => 1120.00
            ]
        ];
        file_put_contents(
            database_path('seeders/fixtures/flights.json'),
            json_encode($flights, JSON_PRETTY_PRINT)
        );
        $this->info('Successfully updated flights.json');

        $this->info('All raw data fixtures updated!');
        return 0;
    }
}
