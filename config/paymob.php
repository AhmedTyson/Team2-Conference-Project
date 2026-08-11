<?php

return [
    'public_key' => env('PAYMOB_PUBLIC_KEY', ''),
    'secret_key' => env('PAYMOB_SECRET_KEY', ''),
    'hmac' => env('PAYMOB_HMAC', ''),
    'integration_ids' => env('PAYMOB_INTEGRATION_IDS', ''),

    // HTTP timeout in seconds (default: 30)
    'timeout' => env('PAYMOB_TIMEOUT', 30),

    // cURL connect timeout in seconds (default: 5)
    'connect_timeout' => env('PAYMOB_CONNECT_TIMEOUT', 5),
];
