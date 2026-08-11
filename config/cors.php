<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Application CORS Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    */

    'paths' => ['api/*', 'graphql'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(array_map(function ($origin) {
        return trim($origin);
    }, explode(',', env('CORS_ALLOWED_ORIGINS', '*')))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => env('CORS_SUPPORTS_CREDENTIALS', false),
];
