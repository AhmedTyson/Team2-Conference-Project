<?php

namespace Database\Seeders;

use App\Services\Catalog\Fixtures\CountryFixtureService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CountrySeeder extends Seeder
{
    public function run()
    {
        $insertData = [];
        $service = app(CountryFixtureService::class);

        // Attempt live API using the Service class
        try {
            $countries = $service->sync();
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
        if (! empty($insertData)) {
            foreach (array_chunk($insertData, 50) as $chunk) {
                DB::table('countries')->insertOrIgnore($chunk);
            }
        }
    }
}
