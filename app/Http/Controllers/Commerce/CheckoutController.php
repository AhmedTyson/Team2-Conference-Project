<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Http\Requests\Commerce\InitiateCheckoutRequest;
use App\Services\Commerce\CheckoutService;
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
