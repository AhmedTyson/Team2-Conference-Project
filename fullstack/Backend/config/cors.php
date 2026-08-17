<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Configure CORS for the API. In production, restrict to your domain(s)
    | via the CORS_ALLOWED_ORIGINS environment variable (comma-separated).
    |
    | Example (Railway env var):
    |   CORS_ALLOWED_ORIGINS=https://yourapp.up.railway.app,https://yourapp.com
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'up'],

    'allowed_methods' => ['*'],

    'allowed_origins' => (function () {
        $envOrigins = env('CORS_ALLOWED_ORIGINS', '');
        if ($envOrigins && $envOrigins !== '*') {
            // Parse comma-separated list from env
            return array_filter(array_map('trim', explode(',', $envOrigins)));
        }
        // Allow all in local/testing; production must set CORS_ALLOWED_ORIGINS
        if (app()->environment('local', 'testing')) {
            return ['*'];
        }
        // Production fallback: same-origin only (served under one domain via start.sh)
        return [env('APP_URL', 'https://yourapp.up.railway.app')];
    })(),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 3600,

    'supports_credentials' => false,

];
