# ============================================================
# Backend — PHP 8.5-FPM + Nginx (API-only, no MVC views)
# Build context: fullstack/Backend
# Railway: set Root Directory = fullstack/Backend in dashboard
# ============================================================

# ── Stage 1: Composer dependencies (PHP 8.5 to match composer.json platform req) ──
FROM php:8.5-fpm-alpine AS vendor

RUN apk add --no-cache git curl unzip libzip-dev libpng-dev libjpeg-turbo-dev freetype-dev \
    libxml2-dev oniguruma-dev \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        zip \
        mbstring \
        pdo_mysql \
        bcmath \
        gd \
        exif \
        pcntl

WORKDIR /app

COPY composer.json composer.lock ./

# Install production deps only (no dev, optimised autoloader).
# --no-scripts: composer's post-autoload-dump runs `php artisan
# package:discover`, which needs the full app source (not present
# in the vendor stage). Laravel regenerates packages.php at boot.
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM php:8.5-fpm-alpine

# System deps + PHP extensions required by Laravel + this app
RUN apk add --no-cache \
        nginx \
        supervisor \
        curl \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libzip-dev \
        libxml2-dev \
        oniguruma-dev \
        gettext \
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql \
        mbstring \
        zip \
        exif \
        pcntl \
        bcmath \
        gd \
        xml \
        opcache

# NOTE: preds/predis (pure PHP) is required via composer.json, so the
# php-redis extension is intentionally NOT compiled (pecl redis fails
# to build against PHP 8.5).

# PHP production config
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY docker/php.ini "$PHP_INI_DIR/conf.d/app.ini"

WORKDIR /var/www/html

# Copy vendor from Stage 1
COPY --from=vendor /app/vendor ./vendor

# Copy application source (everything in fullstack/Backend)
COPY . .

# Fix storage and cache permissions
RUN mkdir -p storage/framework/{cache,sessions,views} \
             storage/logs \
             bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Nginx config — API-only, forwards PHP to FPM
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Supervisor config — runs nginx + php-fpm together
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Startup script: runs artisan commands then hands off to supervisor
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -sf http://localhost:8080/up | grep -q '"status":"ok"' || curl -sf http://localhost:8080/up || exit 1

ENTRYPOINT ["/entrypoint.sh"]
