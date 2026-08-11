<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'rapidapi' => [
        'key' => env('RAPIDAPI_KEY'),
        'hotels_host' => env('RAPIDAPI_HOTELS_HOST', 'travel-advisor.p.rapidapi.com'),
        'flights_host' => env('RAPIDAPI_FLIGHTS_HOST', 'travel-advisor.p.rapidapi.com'),
        'restaurants_host' => env('RAPIDAPI_RESTAURANTS_HOST', 'travel-advisor.p.rapidapi.com'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'openai' => [
        'key' => env('OPENAI_API_KEY'),
    ],

    'open-meteo' => [
        'timeout' => env('OPEN_METEO_TIMEOUT', 5),
        'connect_timeout' => env('OPEN_METEO_CONNECT_TIMEOUT', 3),
    ],

    'osrm' => [
        'timeout' => env('OSRM_TIMEOUT', 5),
        'connect_timeout' => env('OSRM_CONNECT_TIMEOUT', 3),
    ],

];
