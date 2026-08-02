<?php

namespace App\Services\Fixtures;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CountryFixtureService
{
    public function sync(): array
    {
        try {
            $response = Http::timeout(15)->get('https://restcountries.com/v3.1/all');
            
            if (!$response->successful()) {
                throw new \Exception("RestCountries API returned status: " . $response->status());
            }

            $countries = $response->json();
            if (!is_array($countries) || empty($countries)) {
                throw new \Exception("RestCountries API returned empty or invalid JSON");
            }

            $insertData = [];
            foreach ($countries as $country) {
                if (isset($country['name']['common'])) {
                    $insertData[] = [
                        'name' => $country['name']['common'],
                        'iso_code' => $country['cca2'] ?? null,
                        'capital' => $country['capital'][0] ?? null,
                        'flag_url' => $country['flags']['png'] ?? null,
                        'currency' => isset($country['currencies']) ? array_key_first($country['currencies']) : null,
                        'languages' => array_values($country['languages'] ?? []),
                    ];
                }
            }

            return $insertData;
        } catch (\Exception $e) {
            Log::warning("CountryFixtureService failed: " . $e->getMessage());
            throw $e;
        }
    }
}
