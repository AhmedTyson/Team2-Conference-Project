<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);

$start = microtime(true);
$successCount = 0;
$requests = 100;

for ($i = 0; $i < $requests; $i++) {
    $request = Request::create('/api/v1/destinations', 'GET');
    $response = $kernel->handle($request);
    if ($response->getStatusCode() === 200 || $response->getStatusCode() === 401 || $response->getStatusCode() === 429) {
        $successCount++;
    }
}

$end = microtime(true);
$time = round($end - $start, 2);
echo "Load Test Completed.\n";
echo "Processed $requests requests in $time seconds.\n";
echo "Successful HTTP Lifecycle resolutions: $successCount/$requests\n";
