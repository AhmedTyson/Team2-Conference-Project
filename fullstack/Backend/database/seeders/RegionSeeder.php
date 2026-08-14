<?php

namespace Database\Seeders;

use App\Models\Catalog\Country;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RegionSeeder extends Seeder
{
    protected array $regions = [
        'africa' => 'Africa',
        'asia' => 'Asia',
        'europe' => 'Europe',
        'north_america' => 'North America',
        'south_america' => 'South America',
        'oceania' => 'Oceania',
    ];

    public function run(): void
    {
        foreach ($this->regions as $key => $label) {
            DB::table('regions')->insertOrIgnore([
                'key' => $key,
                'label' => $label,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $path = database_path('seeders/fixtures/regions.json');

        if (! file_exists($path)) {
            $this->command?->warn('Region mapping fixture not found; countries left without a region.');

            return;
        }

        $mapping = json_decode(file_get_contents($path), true);
        $regionIds = DB::table('regions')->pluck('id', 'key');

        foreach ($mapping as $isoCode => $regionKey) {
            $regionId = $regionIds[$regionKey] ?? null;

            if (! $regionId) {
                continue;
            }

            Country::where('iso_code', $isoCode)
                ->whereNull('region_id')
                ->update(['region_id' => $regionId]);
        }
    }
}
