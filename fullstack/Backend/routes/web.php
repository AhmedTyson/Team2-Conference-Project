<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes — Pure API Backend Mode
|--------------------------------------------------------------------------
|
| This server operates strictly as a RESTful API backend.
| All application routes and resources are exposed via routes/api.php.
|
*/

// Root API Status Endpoint
Route::get('/', function () {
    return response()->json([
        'status' => 'online',
        'service' => 'Itinera API Backend',
        'version' => '1.0.0',
        'api_base' => url('/api'),
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Paymob GET Callback Web Fallbacks
Route::get('/paymob/callback', [\App\Http\Controllers\Commerce\PaymobWebhookController::class, 'callback']);
Route::get('/v1/paymob/callback', [\App\Http\Controllers\Commerce\PaymobWebhookController::class, 'callback']);
Route::get('/api/v1/paymob/callback', [\App\Http\Controllers\Commerce\PaymobWebhookController::class, 'callback']);
Route::get('/api/paymob/callback', [\App\Http\Controllers\Commerce\PaymobWebhookController::class, 'callback']);

// Fallback JSON 404 response for any unmatched web route
Route::fallback(function () {
    return response()->json([
        'error' => [
            'type' => 'not_found',
            'status' => 404,
            'message' => 'The requested API endpoint or resource was not found on this server. Access all endpoints under /api.',
            'timestamp' => now()->toIso8601String(),
        ]
    ], 404);
});
