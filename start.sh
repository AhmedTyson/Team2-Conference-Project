#!/usr/bin/env bash
set -e

echo "==> Starting Itinera Deployment..."

if [ -d "fullstack/Backend" ]; then
    cd fullstack/Backend

    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        cp .env.example .env
    fi

    if [ -f "composer.json" ]; then
        composer install --no-dev --optimize-autoloader --no-interaction --ignore-platform-reqs || composer install --no-interaction --ignore-platform-reqs || true
    fi

    mkdir -p database
    if [ ! -f "database/database.sqlite" ]; then
        touch database/database.sqlite
    fi

    php artisan key:generate --force || true
    php artisan jwt:secret --force || true
    php artisan config:clear || true
    php artisan cache:clear || true
    php artisan storage:link --force || true
    php artisan migrate --force --seed || true

    if [ -d "../Frontend" ]; then
        echo "==> Syncing Frontend assets into Laravel public directory..."
        cp -r ../Frontend/* public/ 2>/dev/null || true
    fi

    cd ../..
fi

PORT=${PORT:-8000}
echo "==> Serving Application on Port ${PORT}..."

if [ -d "fullstack/Backend" ]; then
    cd fullstack/Backend
    exec php artisan serve --host=0.0.0.0 --port="${PORT}"
else
    exec php -S 0.0.0.0:"${PORT}"
fi
