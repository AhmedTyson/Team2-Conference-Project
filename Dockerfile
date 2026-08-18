# Stage 1: Build stage
FROM php:8.3-fpm as builder

# Install system dependencies and PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    curl \
    libzip-dev \
    libpq-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
    zip \
    pdo \
    pdo_mysql \
    pdo_pgsql \
    gd \
    bcmath \
    ctype \
    fileinfo \
    filter \
    hash \
    json \
    mbstring \
    openssl \
    pcntl \
    session \
    tokenizer \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy backend code
COPY fullstack/Backend .

# Install PHP dependencies
RUN composer install --optimize-autoloader --no-dev --no-interaction --no-scripts

# Run post-install scripts
RUN composer run-script post-autoload-dump || true

# Stage 2: Runtime stage
FROM php:8.3-fpm

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libzip5 \
    libpq5 \
    libpng6 \
    libjpeg62-turbo \
    libfreetype6 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions (runtime only)
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
    zip \
    pdo \
    pdo_mysql \
    pdo_pgsql \
    gd \
    bcmath \
    ctype \
    fileinfo \
    filter \
    hash \
    json \
    mbstring \
    openssl \
    pcntl \
    session \
    tokenizer

# Set working directory
WORKDIR /app

# Copy from builder stage
COPY --from=builder /app /app

# Create necessary directories and set permissions
RUN mkdir -p storage/logs bootstrap/cache \
    && chown -R www-data:www-data /app \
    && chmod -R 755 /app \
    && chmod -R 777 storage bootstrap/cache

# Set user to www-data
USER www-data

# Expose port (if using php artisan serve)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD php /app/artisan tinker --quiet < /dev/null || exit 1

# Start application
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

