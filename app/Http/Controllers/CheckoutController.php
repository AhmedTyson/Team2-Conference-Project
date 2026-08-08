<?php

namespace App\Http\Controllers;

use App\Http\Requests\InitiateCheckoutRequest;
use App\Services\CheckoutService;
use App\Support\ApiResponse;
use Exception;

class CheckoutController extends Controller
{
    public function __construct(
        protected CheckoutService $checkoutService
    ) {}

    public function initiate(InitiateCheckoutRequest $request)
    {
        $validated = $request->validated();

        $productId = $validated['type'] === 'subscription' ? $validated['plan_id'] : $validated['trip_id'];

        try {
            $data = $this->checkoutService->processCheckout(
                $request->user(),
                $validated['type'],
                $productId,
                $validated['billing'] ?? []
            );

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (Exception $e) {
            return ApiResponse::fail(
                $e->getMessage(),
                'checkout_failed',
                422
            );
        }
    }
}
