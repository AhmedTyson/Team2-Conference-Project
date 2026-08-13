#!/usr/bin/env sh
set -e

php artisan storage:link >/dev/null 2>&1 || true
php artisan migrate --force

users=$(php -r 'require "vendor/autoload.php"; $app = require "bootstrap/app.php"; $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); echo DB::table("users")->count();' 2>/dev/null || echo "0")
if [ "$users" = "0" ]; then
  php artisan db:seed --force --no-interaction
fi

php artisan optimize

cp -r frontend/. public/

exec docker-php-entrypoint --config /Caddyfile --adapter caddyfile