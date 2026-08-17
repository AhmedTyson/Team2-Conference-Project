<?php

/**
 * DestinationSeeder.php
 * Date: 2026-08-17
 * Purpose: Seeds comprehensive global destinations and cities linked to Country fixtures.
 */

namespace Database\Seeders;

use App\Models\Catalog\Country;
use App\Models\Catalog\Destination;
use Illuminate\Database\Seeder;

class DestinationSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/fixtures/countries.json');
        if (!file_exists($path)) {
            Destination::factory()->count(20)->create();
            return;
        }

        $countriesData = json_decode(file_get_contents($path), true);
        if (!is_array($countriesData)) {
            Destination::factory()->count(20)->create();
            return;
        }

        // City coordinate & image mappings for top destinations
        $cityMeta = [
            'Cairo' => ['lat' => 30.0444, 'lng' => 31.2357, 'img' => 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80'],
            'Paris' => ['lat' => 48.8566, 'lng' => 2.3522, 'img' => 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80'],
            'Rome' => ['lat' => 41.9028, 'lng' => 12.4964, 'img' => 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80'],
            'Dubai' => ['lat' => 25.2048, 'lng' => 55.2708, 'img' => 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'],
            'Tokyo' => ['lat' => 35.6762, 'lng' => 139.6503, 'img' => 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'],
            'London' => ['lat' => 51.5074, 'lng' => -0.1278, 'img' => 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'],
            'Madrid' => ['lat' => 40.4168, 'lng' => -3.7038, 'img' => 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80'],
            'New York' => ['lat' => 40.7128, 'lng' => -74.0060, 'img' => 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'],
            'Athens' => ['lat' => 37.9838, 'lng' => 23.7275, 'img' => 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'],
            'Amsterdam' => ['lat' => 52.3676, 'lng' => 4.9041, 'img' => 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=800&q=80'],
            'Berlin' => ['lat' => 52.5200, 'lng' => 13.4050, 'img' => 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=80'],
            'Vienna' => ['lat' => 48.2082, 'lng' => 16.3738, 'img' => 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=800&q=80'],
        ];

        foreach ($countriesData as $item) {
            $country = Country::where('iso_code', $item['iso_code'] ?? '')->first();
            if (!$country) {
                $country = Country::create([
                    'name' => $item['name'],
                    'iso_code' => $item['iso_code'] ?? strtoupper(substr($item['name'], 0, 2)),
                    'capital' => $item['capital'] ?? 'Main City',
                    'flag_url' => $item['flag_url'] ?? '',
                    'currency' => $item['currency'] ?? 'USD',
                    'languages' => $item['languages'] ?? ['English'],
                ]);
            }

            $capital = $item['capital'] ?? ($item['name'] . ' City');
            if (!Destination::where('country_id', $country->id)->where('name', $capital)->exists()) {
                $meta = $cityMeta[$capital] ?? [
                    'lat' => rand(10, 60) + (rand(1, 99) / 100),
                    'lng' => rand(-100, 100) + (rand(1, 99) / 100),
                    'img' => 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
                ];

                Destination::create([
                    'country_id' => $country->id,
                    'name' => $capital,
                    'city_name' => $capital,
                    'description' => "Explore the vibrant cultural heritage, landmarks, and luxury experiences of {$capital}, {$country->name}.",
                    'image' => $meta['img'],
                    'latitude' => $meta['lat'],
                    'longitude' => $meta['lng'],
                ]);
            }
        }
    }
}
