<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\Fixtures\CountryFixtureService;
use App\Services\Fixtures\HotelFixtureService;
use App\Services\Fixtures\RestaurantFixtureService;
use App\Services\Fixtures\FlightFixtureService;
use Illuminate\Support\Facades\Log;

class SyncFixtures extends Command
{
    protected $signature = 'fixtures:sync {--only= : Comma-separated list of entities to sync (countries,hotels,restaurants,flights)} {--limit=20 : Maximum number of records to fetch per entity}';
    protected $description = 'Fetch fresh data from external APIs and update local JSON fixtures.';

    public function handle(
        CountryFixtureService $countryService,
        HotelFixtureService $hotelService,
        RestaurantFixtureService $restaurantService,
        FlightFixtureService $flightService
    ) {
        $startTime = microtime(true);
        $only = $this->option('only') ? explode(',', $this->option('only')) : ['countries', 'hotels', 'restaurants', 'flights'];
        $limit = (int) $this->option('limit');

        $summary = [];
        $metaPath = database_path('seeders/fixtures/_meta.json');
        $meta = file_exists($metaPath) ? json_decode(file_get_contents($metaPath), true) : [];

        $this->info("Initializing fixture sync (limit: $limit)...");

        // 1. Sync Countries
        if (in_array('countries', $only)) {
            $this->info("Syncing countries...");
            $cStart = microtime(true);
            try {
                $data = $countryService->sync();
                $this->backupAndWrite('countries.json', $data);
                
                $duration = round(microtime(true) - $cStart, 2);
                $summary[] = ['countries', count($data), count($data), "{$duration}s"];
                $meta['countries'] = ['last_synced_at' => now()->toIso8601String()];
            } catch (\Exception $e) {
                $this->error("Failed to sync countries: " . $e->getMessage());
            }
        }

        // 2. Sync Hotels
        if (in_array('hotels', $only)) {
            $this->info("Syncing hotels...");
            $hStart = microtime(true);
            try {
                $data = $hotelService->sync($limit);
                $this->backupAndWrite('hotels.json', $data);

                $duration = round(microtime(true) - $hStart, 2);
                $summary[] = ['hotels', count($data), count($data), "{$duration}s"];
                $meta['hotels'] = ['last_synced_at' => now()->toIso8601String()];
            } catch (\Exception $e) {
                $this->error("Failed to sync hotels: " . $e->getMessage());
            }
        }

        // 3. Sync Restaurants
        if (in_array('restaurants', $only)) {
            $this->info("Syncing restaurants...");
            $rStart = microtime(true);
            try {
                $data = $restaurantService->sync($limit);
                $this->backupAndWrite('restaurants.json', $data);

                $duration = round(microtime(true) - $rStart, 2);
                $summary[] = ['restaurants', count($data), count($data), "{$duration}s"];
                $meta['restaurants'] = ['last_synced_at' => now()->toIso8601String()];
            } catch (\Exception $e) {
                $this->error("Failed to sync restaurants: " . $e->getMessage());
            }
        }

        // 4. Sync Flights
        if (in_array('flights', $only)) {
            $this->info("Syncing flights...");
            $fStart = microtime(true);
            try {
                $data = $flightService->sync($limit);
                $this->backupAndWrite('flights.json', $data);

                $duration = round(microtime(true) - $fStart, 2);
                $summary[] = ['flights', count($data), count($data), "{$duration}s"];
                $meta['flights'] = ['last_synced_at' => now()->toIso8601String()];
            } catch (\Exception $e) {
                $this->error("Failed to sync flights: " . $e->getMessage());
            }
        }

        // Write Meta File
        file_put_contents($metaPath, json_encode($meta, JSON_PRETTY_PRINT));

        // Output summary table
        $this->newLine();
        $this->table(['Entity', 'Records Fetched', 'Records Written', 'Duration'], $summary);

        $totalTime = round(microtime(true) - $startTime, 2);
        $this->info("Fixture sync completed in {$totalTime}s!");
        return 0;
    }

    private function backupAndWrite(string $filename, array $data): void
    {
        $filePath = database_path("seeders/fixtures/{$filename}");
        $backupPath = database_path("seeders/fixtures/{$filename}.bak");

        // Backup existing file if exists
        if (file_exists($filePath)) {
            copy($filePath, $backupPath);
        }

        // Overwrite file
        file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));
    }
}
