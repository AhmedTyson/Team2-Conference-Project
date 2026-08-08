<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\CheckoutService;
use Exception;

class CheckoutController extends Controller
{
    public function __construct(
        protected CheckoutService $checkoutService
    ) {}

    public function initiate(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:trip_package,trip_fork,subscription',
            'trip_id' => 'required_if:type,trip_package,trip_fork|integer|exists:trips,id',
            'plan_id' => 'required_if:type,subscription|integer|exists:plans,id',
            'billing' => 'nullable|array',
            'billing.first_name' => 'nullable|string',
            'billing.last_name' => 'nullable|string',
            'billing.email' => 'nullable|email',
            'billing.phone_number' => 'nullable|string',
        ]);

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
                'data' => $data
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
