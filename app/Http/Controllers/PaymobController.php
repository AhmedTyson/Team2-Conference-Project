<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PaymobController extends Controller
{
    /**
     * Compatibility shim for routes registered by paymob/laravel-package
     * (paymob/callback, paymob/process).
     *
     * These legacy endpoints are superseded by /api/v1/paymob/*.
     */
    public function callback(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Legacy callback endpoint. Payment confirmations arrive via POST /api/v1/paymob/webhook.',
        ], 404);
    }

    public function process(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Legacy process endpoint. Use POST /api/v1/checkout/initiate instead.',
        ], 404);
    }
}
