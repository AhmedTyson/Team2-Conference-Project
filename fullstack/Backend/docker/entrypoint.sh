#!/bin/sh
set -e

cd /var/www/html

echo "[entrypoint] Starting Itinari API backend..."

# ── 1. Config cache ──────────────────────────────────────────
# CORS_ALLOWED_ORIGINS and all other Railway env vars are
# live in the environment — config:cache bakes them in.
echo "[entrypoint] Caching configuration..."
php artisan config:cache --no-interaction

# ── 2. Route cache ───────────────────────────────────────────
echo "[entrypoint] Caching routes..."
php artisan route:cache --no-interaction

# ── 3. View cache ────────────────────────────────────────────
# API-only app may ship without blade views — tolerating failure.
echo "[entrypoint] Caching views..."
php artisan view:cache --no-interaction 2>/dev/null || true

# ── 4. Storage link ──────────────────────────────────────────
echo "[entrypoint] Linking storage..."
php artisan storage:link --no-interaction 2>/dev/null || true

# ── 5. Database migrations ───────────────────────────────────
echo "[entrypoint] Running migrations..."
php artisan migrate --force --no-interaction

# ── 6. Optional seeding (first deploy only) ──────────────────
if [ "${SEED_ON_DEPLOY:-false}" = "true" ]; then
    echo "[entrypoint] Seeding database (SEED_ON_DEPLOY=true)..."
    php artisan db:seed --force --no-interaction
fi

# ── 7. Fix permissions ───────────────────────────────────────
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

echo "[entrypoint] Boot complete. Starting services..."

# Hand off to supervisord (nginx + php-fpm + queue)
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
