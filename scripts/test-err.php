<?php

use App\Http\Controllers\Admin\AdminUserController;
use Illuminate\Contracts\Console\Kernel;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

try {
    app()->make(AdminUserController::class);
} catch (Throwable $e) {
    echo $e->getMessage();
}
