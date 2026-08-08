<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Compatibility shim for routes registered by paymob/laravel-package
 * (paymob/callback, paymob/process).
 *
 * The real payment flow lives in CheckoutController + PaymobWebhookController;
 * these legacy GET routes are kept only so the package's route registrations
 * resolve to a controller. They intentionally do NOT process payments.
 */
class PaymobController extends Controller
{
    public function process(): JsonResponse
    {
        return response()->json([
            'IsSuccess' => 'false',
            'Message' => 'Legacy GET endpoint. Use POST /api/v1/checkout/initiate and the Paymob webhook flow instead.',
        ]);
    }

    public function callback(Request $request): JsonResponse
    {
        return response()->json([
            'IsSuccess' => 'false',
            'Message' => 'Legacy callback endpoint. Payment confirmations arrive via POST /api/v1/paymob/webhook.',
        ]);
    }
}
