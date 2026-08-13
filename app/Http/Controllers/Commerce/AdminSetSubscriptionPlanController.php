<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Http\Requests\Commerce\AdminSetSubscriptionPlanRequest;
use App\Models\Commerce\Plan;
use App\Support\ApiResponse;

class AdminSetSubscriptionPlanController extends Controller
{
    public function index(): JsonResponse
    {
        $plans = Plan::all();

        return ApiResponse::success($plans, 'Subscription plans retrieved successfully');
    }

    public function update(AdminSetSubscriptionPlanRequest $request): JsonResponse
    {
        $data = $request->validated();

        $plan = Plan::findOrFail($data['plan_id']);

        $plan->update([
            'name' => $data['name'],
            'price_monthly' => $data['price_monthly'],
            'price_yearly' => $data['price_yearly'],
            'features' => $data['features'],
        ]);

        return ApiResponse::success($plan, 'Subscription plan updated successfully');
    }
}
