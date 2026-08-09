<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$r = \App\Models\System\Report::latest()->first();
if ($r) echo "Status: {$r->status}, Error: {$r->error_message}\n";
