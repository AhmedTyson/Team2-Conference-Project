# ============================================================
# Monorepo root Dockerfile
# Builds EITHER the static frontend (SERVICE_ROLE=frontend) or
# the Laravel API backend (SERVICE_ROLE=backend).
# Railway exposes each service's SERVICE_ROLE variable as a
# build ARG (see docs.railway.com/builds/dockerfiles).
# ============================================================
ARG SERVICE_ROLE=frontend

# ── Frontend variant: static site on nginx ──────────────────
FROM nginx:1.27-alpine AS frontend
ARG SERVICE_ROLE

COPY fullstack/Frontend /usr/share/nginx/html/
COPY fullstack/Frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY fullstack/Frontend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:${PORT:-80}/ || exit 1

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

# ── Backend variant: Laravel API (php-fpm + nginx + queue) ──
# Stage 1: Composer dependencies (PHP 8.5 to match composer.json platform req)
FROM php:8.5-fpm-alpine AS vendor
ARG SERVICE_ROLE

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
COPY fullstack/Backend/composer.json fullstack/Backend/composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

# Stage 2: Runtime
FROM php:8.5-fpm-alpine AS backend
ARG SERVICE_ROLE

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
        gd

# xml/opcache ship compiled into the alpine php:fpm image (core),
# hence intentionally NOT passed to docker-php-ext-install.

# NOTE: preds/predis (pure PHP) is required via composer.json, so the
# php-redis extension is intentionally NOT compiled (pecl redis fails
# to build against PHP 8.5).

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY fullstack/Backend/docker/php.ini "$PHP_INI_DIR/conf.d/app.ini"

WORKDIR /var/www/html

COPY --from=vendor /app/vendor ./vendor

COPY fullstack/Backend/ .

RUN mkdir -p storage/framework/{cache,sessions,views} \
             storage/logs \
             bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY fullstack/Backend/docker/nginx.conf /etc/nginx/nginx.conf
COPY fullstack/Backend/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY fullstack/Backend/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -sf http://localhost:8080/up | grep -q '"status":"ok"' || curl -sf http://localhost:8080/up || exit 1

ENTRYPOINT ["/entrypoint.sh"]

# ── Final stage selected by SERVICE_ROLE ────────────────────
FROM ${SERVICE_ROLE}