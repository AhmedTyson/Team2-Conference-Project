<?php

namespace App\Services\Fixtures;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CountryFixtureService
{
    public const SOURCE_URL = 'https://raw.githubusercontent.com/mledoze/countries/master/countries.json';

    public function sync(): array
    {
        try {
            $response = Http::timeout(30)->get(self::SOURCE_URL);

            if (!$response->successful()) {
                throw new \Exception("Countries dataset returned status: " . $response->status());
            }

            $countries = $response->json();
            if (!is_array($countries) || empty($countries)) {
                throw new \Exception("Countries dataset returned empty or invalid JSON");
            }

            $insertData = [];
            foreach ($countries as $country) {
                $commonName = $country['name']['common'] ?? null;
                if (!$commonName) {
                    continue;
                }

                $isoCode = strtoupper($country['cca2'] ?? '');

                $insertData[] = [
                    'name' => $commonName,
                    'iso_code' => $isoCode ?: null,
                    'capital' => $country['capital'][0] ?? null,
                    'flag_url' => $isoCode
                        ? 'https://flagcdn.com/w320/' . strtolower($isoCode) . '.png'
                        : null,
                    'currency' => isset($country['currencies']) ? array_key_first($country['currencies']) : null,
                    'languages' => array_values($country['languages'] ?? []),
                ];
            }

            return $insertData;
        } catch (\Exception $e) {
            Log::warning("CountryFixtureService failed: " . $e->getMessage());
            throw $e;
        }
    }
}
