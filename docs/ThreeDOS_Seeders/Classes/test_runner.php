<?php
// =========================================================================
// LARAVEL MOCK ENVIRONMENT
// This allows testing Seeders without a real database or Laravel framework.
// =========================================================================

namespace Illuminate\Database {
    class Seeder {
        public $command;
        public function __construct() {
            $this->command = new class {
                public function warn($msg) { echo "[WARN] $msg\n"; }
            };
        }
    }
}

namespace Illuminate\Support\Facades {
    class DB {
        public static function table($name) {
            return new class($name) {
                private $table;
                public function __construct($table) { $this->table = $table; }
                public function insert($data) {
                    $log = date('Y-m-d H:i:s') . " - INSERT INTO `{$this->table}`: \n" . json_encode($data, JSON_PRETTY_PRINT) . "\n\n";
                    file_put_contents(__DIR__ . '/../Logs/seeder_output.log', $log, FILE_APPEND);
                    echo "Logged insert for {$this->table}...\n";
                }
                public function insertOrIgnore($data) {
                    $this->insert($data);
                }
            };
        }
    }

    class Http {
        public static function timeout($sec) { return new static; }
        public static function get($url) {
            return new class($url) {
                private $data;
                private $failed = false;
                public function __construct($url) {
                    // For the test, we'll just mock the RestCountries API to be fast and safe
                    $this->data = [
                        [
                            'name' => ['common' => 'Mocked France'],
                            'cca2' => 'FR',
                            'capital' => ['Paris'],
                            'flags' => ['png' => 'https://flagcdn.com/w320/fr.png'],
                            'currencies' => ['EUR' => ['name' => 'Euro']],
                            'languages' => ['fra' => 'French']
                        ],
                        [
                            'name' => ['common' => 'Mocked Japan'],
                            'cca2' => 'JP',
                            'capital' => ['Tokyo'],
                            'flags' => ['png' => 'https://flagcdn.com/w320/jp.png'],
                            'currencies' => ['JPY' => ['name' => 'Japanese yen']],
                            'languages' => ['jpn' => 'Japanese']
                        ]
                    ];
                }
                public function failed() { return $this->failed; }
                public function json() { return $this->data; }
            };
        }
    }
}

namespace Faker {
    class Factory {
        public static function create() {
            return new class {
                public function sentence($words = 3) { return "Mock generated sentence for testing."; }
                public function randomElement($arr) { return $arr[array_rand($arr)]; }
                public function paragraph() { return "Mock generated paragraph containing simulated text."; }
                public function numberBetween($min, $max) { return rand($min, $max); }
                public function optional($chance = 0.5) { 
                    return new class {
                        public function paragraph() { return "Optional mock paragraph."; }
                        public function sentence() { return "Optional mock sentence."; }
                    };
                }
            };
        }
    }
}

namespace {
    // Global helper functions
    function now() { return date('Y-m-d H:i:s'); }
    function database_path($path) { 
        // Map database_path('seeders/fixtures/...') to our actual Fixtures directory
        return __DIR__ . '/../' . str_replace('seeders/fixtures/', 'Fixtures/', $path); 
    }
    
    // Initialize Log file
    $logFile = __DIR__ . '/../Logs/seeder_output.log';
    file_put_contents($logFile, "=== SEEDER TEST RUN (" . now() . ") ===\n\n");

    echo "Running Seeders in Mock Environment...\n";

    // Load Seeder Classes
    require_once __DIR__ . '/CountrySeeder.php';
    require_once __DIR__ . '/HotelSeeder.php';
    require_once __DIR__ . '/RestaurantSeeder.php';
    require_once __DIR__ . '/FlightSeeder.php';
    require_once __DIR__ . '/NotificationSeeder.php';
    require_once __DIR__ . '/ReviewSeeder.php';
    require_once __DIR__ . '/FavouriteSeeder.php';

    // Execute Seeders
    (new \Database\Seeders\CountrySeeder())->run();
    (new \Database\Seeders\HotelSeeder())->run();
    (new \Database\Seeders\RestaurantSeeder())->run();
    (new \Database\Seeders\FlightSeeder())->run();
    (new \Database\Seeders\NotificationSeeder())->run();
    (new \Database\Seeders\ReviewSeeder())->run();
    (new \Database\Seeders\FavouriteSeeder())->run();
    
    echo "\nAll seeders executed successfully.\nLog saved to: " . realpath($logFile) . "\n";
}
