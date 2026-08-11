<?php

namespace App\Console\Commands;

use App\Models\Catalog\Country;
use App\Services\Catalog\Fixtures\CityFixtureService;
use Illuminate\Console\Command;

class SyncCities extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cities:sync {country_code? : The 2-letter ISO code of the country (e.g., EG, FR, US)} {--limit=10 : The maximum number of cities to fetch}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dynamically fetch real cities and coordinates for a country using Wikidata API and seed them as Destinations.';

    /**
     * Execute the console command.
     */
    public function handle(CityFixtureService $cityService)
    {
        $code = $this->argument('country_code');
        $limit = (int) $this->option('limit');

        if ($code) {
            $countries = Country::where('iso_code', strtoupper($code))->get();
            if ($countries->isEmpty()) {
                $this->error("No country found in the database with ISO code '{$code}'. Please add it first.");
                return;
            }
        } else {
            $countries = Country::whereNotNull('iso_code')->get();
            if ($countries->isEmpty()) {
                $this->error("No countries found with valid ISO codes in the database.");
                return;
            }
            if (!$this->confirm("Are you sure you want to fetch cities for ALL {$countries->count()} countries? This will make many API requests.")) {
                return;
            }
        }

        $this->info("Fetching up to {$limit} top cities per country from Wikidata...");

        $totalCities = 0;
        $bar = $this->output->createProgressBar($countries->count());

        foreach ($countries as $country) {
            $count = $cityService->syncForCountry($country, $limit);
            $totalCities += $count;
            $bar->advance();
            // Small delay to be polite to Wikidata API
            usleep(250000); 
        }

        $bar->finish();
        $this->newLine();
        $this->info("Successfully fetched and inserted {$totalCities} real cities as destinations!");
    }
}