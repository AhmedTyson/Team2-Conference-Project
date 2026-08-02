<?php
namespace Illuminate\Support\Facades {
    class DB {
        public static $totalInserted = 0;
        public static $logFile = __DIR__ . '/../Logs/load_test_output.log';
        
        public static function table($name) {
            return new class($name) {
                private $table;
                public function __construct($table) { $this->table = $table; }
                
                public function insert($data) {
                    $count = isset($data[0]) ? count($data) : 1;
                    \Illuminate\Support\Facades\DB::$totalInserted += $count;
                    
                    // Log the chunk insertion with a sample of the first record
                    $sample = isset($data[0]) ? json_encode($data[0]) : "{}";
                    $logLine = date('Y-m-d H:i:s') . " - [BATCH INSERT] $count records into `{$this->table}` | Sample: $sample\n";
                    file_put_contents(\Illuminate\Support\Facades\DB::$logFile, $logLine, FILE_APPEND);
                }
                public function insertOrIgnore($data) { $this->insert($data); }
            };
        }
    }
}

namespace {
    ini_set('memory_limit', '512M');
    set_time_limit(0);

    function now() { return date('Y-m-d H:i:s'); }
    
    // Clear previous log
    file_put_contents(\Illuminate\Support\Facades\DB::$logFile, "=== LOAD TEST LOG RUN (" . now() . ") ===\n\n");
    
    echo "=== DATA SEEDER LOAD TESTER (LOGGED) ===\n";
    echo "Preparing massive fixtures...\n";

    // --- 2. GENERATE MASSIVE FIXTURE (100,000 Hotels) ---
    $massiveFixturePath = __DIR__ . '/../Fixtures/hotels_massive.json';
    $targetRecords = 100000;
    
    $hotels = [];
    for ($i = 0; $i < $targetRecords; $i++) {
        $hotels[] = [
            'name' => 'Load Test Hotel ' . $i,
            'price' => rand(50, 1000),
            'rating' => rand(10, 50) / 10,
            'stars' => rand(1, 5),
            'image' => 'hotels/test.jpg'
        ];
    }
    file_put_contents($massiveFixturePath, json_encode($hotels));
    echo "Generated " . number_format($targetRecords) . " records in JSON fixture.\n\n";

    // --- 3. TEST 1: JSON PARSING & MAPPING (HotelSeeder logic) ---
    echo "[TEST 1] Parsing 100,000 JSON Records & Mapping Array...\n";
    
    $startTime = microtime(true);
    
    // Exact logic from HotelSeeder
    $parsedHotels = json_decode(file_get_contents($massiveFixturePath), true);
    $insertData = [];
    foreach ($parsedHotels as $hotel) {
        $insertData[] = [
            'destination_id' => rand(1, 15),
            'name' => $hotel['name'],
            'price_per_night' => $hotel['price'],
            'rating' => $hotel['rating'],
            'stars' => $hotel['stars'],
            'image' => $hotel['image'],
            'availability' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
    // Simulate chunked DB insert
    foreach (array_chunk($insertData, 1000) as $chunk) {
        \Illuminate\Support\Facades\DB::table('hotels')->insert($chunk);
    }

    $time1 = microtime(true) - $startTime;
    $memory1 = memory_get_peak_usage(true) / 1024 / 1024;
    echo "Result: Completed in " . round($time1, 4) . " seconds.\n";
    echo "Memory Peak: " . round($memory1, 2) . " MB\n";
    echo "Speed: " . number_format($targetRecords / $time1) . " rows/sec\n\n";

    // --- 4. TEST 2: POLYMORPHIC GENERATION (ReviewSeeder logic) ---
    echo "[TEST 2] Generating 100,000 Polymorphic Relations in Memory...\n";
    
    $startTime2 = microtime(true);
    $morphTargets = ['App\Models\Destination', 'App\Models\Hotel', 'App\Models\Restaurant', 'App\Models\Attraction'];
    $reviews = [];
    
    for ($i = 0; $i < $targetRecords; $i++) {
        $reviews[] = [
            'user_id' => rand(1, 10),
            'reviewable_type' => $morphTargets[array_rand($morphTargets)],
            'reviewable_id' => rand(1, 15),
            'rating' => rand(1, 5),
            'comment' => "Load test comment...",
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
    
    foreach (array_chunk($reviews, 1000) as $chunk) {
        \Illuminate\Support\Facades\DB::table('reviews')->insert($chunk);
    }

    $time2 = microtime(true) - $startTime2;
    $memory2 = memory_get_peak_usage(true) / 1024 / 1024;
    echo "Result: Completed in " . round($time2, 4) . " seconds.\n";
    echo "Memory Peak: " . round($memory2, 2) . " MB\n";
    echo "Speed: " . number_format($targetRecords / $time2) . " rows/sec\n\n";

    // --- 5. FINAL STATS ---
    $finalStats = "\n--- TOTALS ---\n" .
                  "Total Records Processed: " . number_format(\Illuminate\Support\Facades\DB::$totalInserted) . "\n" .
                  "Test 1 (JSON) Speed: " . number_format($targetRecords / $time1) . " rows/sec\n" .
                  "Test 2 (Morph) Speed: " . number_format($targetRecords / $time2) . " rows/sec\n";
                  
    echo $finalStats;
    file_put_contents(\Illuminate\Support\Facades\DB::$logFile, $finalStats, FILE_APPEND);
    
    // Cleanup massive fixture
    @unlink($massiveFixturePath);
}
