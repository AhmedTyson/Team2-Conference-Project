<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    app()->make(\App\Http\Controllers\Admin\AdminUserController::class);
} catch (\Throwable $e) {
    echo $e->getMessage();
}
