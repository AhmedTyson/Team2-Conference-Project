<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class CountrySeeder extends Seeder
{
    public function run()
    {
        $insertData = [];

        // Attempt live API
        try {
            $response = Http::timeout(10)->get('https://restcountries.com/v3.1/all');
            if ($response->successful() && is_array($response->json()) && count($response->json()) > 0) {
                $countries = $response->json();
                foreach ($countries as $country) {
                    if (isset($country['name']['common'])) {
                        $insertData[] = [
                            'name' => $country['name']['common'],
                            'iso_code' => $country['cca2'] ?? null,
                            'capital' => $country['capital'][0] ?? null,
                            'flag_url' => $country['flags']['png'] ?? null,
                            'currency' => isset($country['currencies']) ? array_key_first($country['currencies']) : null,
                            'languages' => json_encode(array_values($country['languages'] ?? [])),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                }
            }
        } catch (\Exception $e) {
            // Live API failed, fallback to local fixture
        }

        // Fallback to local JSON if live API failed or was unreachable
        if (empty($insertData)) {
            $path = database_path('seeders/fixtures/countries.json');
            if (file_exists($path)) {
                $countries = json_decode(file_get_contents($path), true);
                foreach ($countries as $country) {
                    $insertData[] = [
                        'name' => $country['name'],
                        'iso_code' => $country['iso_code'],
                        'capital' => $country['capital'],
                        'flag_url' => $country['flag_url'],
                        'currency' => $country['currency'],
                        'languages' => json_encode($country['languages']),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        // Insert in chunks to avoid large packet errors
        if (!empty($insertData)) {
            foreach (array_chunk($insertData, 50) as $chunk) {
                DB::table('countries')->insertOrIgnore($chunk);
            }
        }
    }
}