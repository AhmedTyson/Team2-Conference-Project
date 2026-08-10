<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Http\Requests\Commerce\AdminSetSubscriptionPlanRequest;
use App\Models\Commerce\Plan;

class AdminSetSubscriptionPlanController extends Controller
{
    public function index()
    {
        $plans = Plan::all();

        return response()->json($plans);
    }

    public function update(AdminSetSubscriptionPlanRequest $request)
    {
        $data = $request->validated();

        $plan = Plan::findOrFail($data['plan_id']);

        $plan->update([
            'name' => $data['name'],
            'price_monthly' => $data['price_monthly'],
            'price_yearly' => $data['price_yearly'],
            'features' => $data['features'],
        ]);

        return response()->json($plan);
    }
}
