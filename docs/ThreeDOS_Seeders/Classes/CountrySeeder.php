<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class CountrySeeder extends Seeder
{
    public function run()
    {
        $response = Http::timeout(15)->get('https://restcountries.com/v3.1/all');
        
        if ($response->failed()) {
            $this->command->warn("RestCountries API unreachable.");
            return;
        }

        $countries = $response->json();
        $insertData = [];

        foreach ($countries as $country) {
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

        // Insert in chunks to avoid large packet errors
        foreach (array_chunk($insertData, 50) as $chunk) {
            DB::table('countries')->insertOrIgnore($chunk);
        }
    }
}
