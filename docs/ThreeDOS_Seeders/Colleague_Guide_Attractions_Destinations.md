# Guide: Creating the Attraction and Destination Seeders

This guide explains how to create the `AttractionSeeder` and `DestinationSeeder` following the "Fixture-First" pattern used for the rest of the project.

## Core Rule
Do not use `Http::get()` for RapidAPI endpoints in seeders, as it will exhaust rate limits. Instead, pull down a sample JSON response via Postman, save it as a fixture, and parse it locally.

---

## 1. DestinationSeeder
While you can hardcode destinations, using an external API fixture (like GeoDB Cities via RapidAPI) provides richer data (latitude/longitude, exact city names).

### Step A: Create the Fixture
1. Go to RapidAPI (GeoDB Cities or similar).
2. Fetch a list of major cities (e.g., Paris, Tokyo, Dubai).
3. Save the JSON response as `database/seeders/fixtures/destinations.json`.

### Step B: Write the Seeder
Create `Database/Seeders/DestinationSeeder.php`:

```php
<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DestinationSeeder extends Seeder
{
    public function run()
    {
        $path = database_path('seeders/fixtures/destinations.json');
        // Fallback for independent testing
        if (!function_exists('database_path')) {
            $path = __DIR__ . '/../Fixtures/destinations.json';
        }

        if (!file_exists($path)) {
            echo "Fixture not found: {$path}\n";
            return;
        }

        $destinations = json_decode(file_get_contents($path), true);
        $insertData = [];

        foreach ($destinations['data'] as $dest) { // adjust 'data' based on API structure
            $insertData[] = [
                'country_id' => rand(1, 200), // Mock FK
                'name' => $dest['city'],
                'city_name' => $dest['city'],
                'description' => "A beautiful city...",
                'image' => "destinations/" . strtolower($dest['city']) . ".jpg",
                'latitude' => $dest['latitude'],
                'longitude' => $dest['longitude'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('destinations')->insert($insertData);
    }
}
```

---

## 2. AttractionSeeder
Attractions (museums, parks, historical sites) belong to a Destination and a Category.

### Step A: Create the Fixture
1. Go to RapidAPI (e.g., TripAdvisor API or Foursquare).
2. Fetch tourist attractions for a specific city.
3. Save the JSON response as `database/seeders/fixtures/attractions.json`.

### Step B: Write the Seeder
Create `Database/Seeders/AttractionSeeder.php`:

```php
<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AttractionSeeder extends Seeder
{
    public function run()
    {
        $path = database_path('seeders/fixtures/attractions.json');
        if (!function_exists('database_path')) {
            $path = __DIR__ . '/../Fixtures/attractions.json';
        }

        if (!file_exists($path)) {
            echo "Fixture not found: {$path}\n";
            return;
        }

        $attractions = json_decode(file_get_contents($path), true);
        $insertData = [];

        foreach ($attractions as $attraction) {
            $insertData[] = [
                'destination_id' => rand(1, 15), // Mock FK
                'category_id' => rand(1, 5),     // Mock FK
                'name' => $attraction['name'],
                'description' => $attraction['description'] ?? 'A great place to visit.',
                'image' => $attraction['image_url'] ?? null,
                'latitude' => $attraction['latitude'] ?? null,
                'longitude' => $attraction['longitude'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('attractions')->insert($insertData);
    }
}
```

### Key Takeaways for Colleague:
1. Always wrap the JSON reading in `file_exists()` to prevent seeder crashes if the fixture is missing.
2. Because the DB doesn't exist yet, we mock Foreign Keys (`rand(1, 15)`) or use `DB::table()->insert()` instead of Eloquent models.
3. Don't forget `created_at` and `updated_at` when using the `DB` facade!