#!/usr/bin/env bash
set -e

echo "==> Starting Itinari Production Deployment..."

cd fullstack/Backend

# ─── Environment ───────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "==> Created .env from .env.example"
    fi
fi

# ─── Composer — install if vendor/ is missing (Railway gitignores it) ──────
if [ ! -f "vendor/autoload.php" ]; then
    echo "==> vendor/ not found — running composer install..."
    composer install --no-dev --optimize-autoloader --no-interaction --ignore-platform-reqs
else
    echo "==> vendor/ already present, skipping composer install."
fi

# ─── Application Key & JWT ─────────────────────────────────────────────────
php artisan key:generate --force || true
php artisan jwt:secret --force || true

# ─── Clear all caches before migration ─────────────────────────────────────
php artisan config:clear || true
php artisan cache:clear  || true
php artisan route:clear  || true
php artisan view:clear   || true

# ─── Storage Link ──────────────────────────────────────────────────────────
php artisan storage:link --force || true

# ─── Database ──────────────────────────────────────────────────────────────
echo "==> Running migrations..."
php artisan migrate --force

# Seed only on explicit first deploy (set SEED_ON_DEPLOY=true in Railway env vars)
if [ "${SEED_ON_DEPLOY}" = "true" ]; then
    echo "==> SEED_ON_DEPLOY=true — running database seeders..."
    php artisan db:seed --force
    echo "==> Seeding complete. Unset SEED_ON_DEPLOY after first deploy!"
fi

# ─── Production Optimizations ──────────────────────────────────────────────
echo "==> Caching config, routes and views..."
php artisan config:cache || true
php artisan route:cache  || true
php artisan view:cache   || true
php artisan optimize     || true

# ─── Copy Frontend into Laravel public/ ────────────────────────────────────
if [ -d "../Frontend" ]; then
    echo "==> Syncing Frontend assets into Laravel public/..."
    rsync -a --exclude="index.php" \
              --exclude=".htaccess" \
              --exclude="robots.txt" \
              --exclude="storage" \
              --exclude="images" \
              --exclude="uploads" \
              ../Frontend/ public/ 2>/dev/null || \
    cp -r ../Frontend/. public/ 2>/dev/null || true
fi

cd ../..

# ─── Start Server ──────────────────────────────────────────────────────────
PORT=${PORT:-8000}
echo "==> Serving Itinari on port ${PORT}..."
cd fullstack/Backend
exec php artisan serve --host=0.0.0.0 --port="${PORT}"
