<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Account\User;

$admin = User::where('email', 'admin@itinari.com')->first();
echo "Admin Email: " . $admin->email . "\n";
echo "Roles: " . implode(', ', $admin->roles->pluck('name')->toArray()) . "\n";
echo "Guards: " . implode(', ', $admin->roles->pluck('guard_name')->toArray()) . "\n";
echo "hasRole('super_admin', 'api'): " . ($admin->hasRole('super_admin', 'api') ? 'YES' : 'NO') . "\n";
echo "hasRole('admin', 'api'): " . ($admin->hasRole('admin', 'api') ? 'YES' : 'NO') . "\n";
