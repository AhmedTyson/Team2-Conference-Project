<?php

namespace App\Services\Catalog\Fixtures;

use App\Models\Catalog\Country;
use App\Models\Catalog\Destination;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CityFixtureService
{
    /**
     * Fetch real cities from Wikidata for a given country and seed them into the destinations table.
     */
    public function syncForCountry(Country $country, int $limit = 10): int
    {
        if (! $country->iso_code) {
            Log::warning("Cannot fetch cities for country {$country->name} without an ISO code.");

            return 0;
        }

        $isoCode = strtoupper($country->iso_code);

        $query = 'SELECT DISTINCT ?cityLabel ?lat ?lon ?population WHERE { 
            ?country wdt:P297 "'.$isoCode.'". 
            ?city wdt:P31/wdt:P279* wd:Q515; 
                  wdt:P17 ?country; 
                  wdt:P625 ?coords; 
                  wdt:P1082 ?population. 
            BIND(geof:latitude(?coords) AS ?lat) 
            BIND(geof:longitude(?coords) AS ?lon) 
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } 
        } ORDER BY DESC(?population) LIMIT '.$limit;

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'User-Agent' => 'Itinera/1.0',
            ])->timeout(30)->get('https://query.wikidata.org/sparql', [
                'query' => $query,
            ]);

            if (! $response->successful()) {
                throw new \Exception("Wikidata API failed with status {$response->status()}");
            }

            $results = $response->json('results.bindings');

            if (empty($results)) {
                return 0;
            }

            $count = 0;
            // Prevent exact duplicates in the response
            $seenNames = [];

            foreach ($results as $item) {
                $cityName = $item['cityLabel']['value'] ?? null;
                $lat = $item['lat']['value'] ?? null;
                $lon = $item['lon']['value'] ?? null;

                if (! $cityName || ! $lat || ! $lon || in_array($cityName, $seenNames)) {
                    continue;
                }

                $seenNames[] = $cityName;

                Destination::updateOrCreate(
                    [
                        'country_id' => $country->id,
                        'name' => $cityName,
                    ],
                    [
                        'city_name' => $cityName,
                        'latitude' => (float) $lat,
                        'longitude' => (float) $lon,
                        'description' => "Welcome to {$cityName}, a beautiful destination in {$country->name}.",
                        'image' => 'img/destination.jpg',
                    ]
                );

                $count++;
            }

            return $count;

        } catch (\Throwable $e) {
            Log::error("Failed to sync cities for {$country->name}: ".$e->getMessage());

            return 0;
        }
    }
}
