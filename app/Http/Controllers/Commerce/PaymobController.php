<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymobController extends Controller
{
    /**
     * Compatibility shim for routes registered by paymob/laravel-package
     * (paymob/callback, paymob/process).
     *
     * These legacy endpoints are superseded by /api/paymob/*.
     */
    public function callback(Request $request): JsonResponse
    {
        return ApiResponse::fail('Legacy callback endpoint. Payment confirmations arrive via POST /api/paymob/webhook.', 'legacy_endpoint', 404);
    }

    public function process(Request $request): JsonResponse
    {
        return ApiResponse::fail('Legacy process endpoint. Use POST /api/checkout/initiate instead.', 'legacy_endpoint', 404);
    }
}
