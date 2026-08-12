<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Http\Requests\Commerce\AdminSetPlansRequest;
use App\Http\Requests\Commerce\SubscribePlanRequest;
use App\Http\Requests\Commerce\UpgradePlanRequest;
use App\Services\Commerce\PlanService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class PlanController extends Controller
{
    protected $planService;

    public function __construct(PlanService $planService)
    {
        $this->planService = $planService;
    }

    public function setPlans(AdminSetPlansRequest $request): JsonResponse
    {
        $plans = $this->planService->setPlans($request->input('plans'));

        return ApiResponse::success($plans, 'Plans set successfully', 200);
    }

    public function index(): JsonResponse
    {
        return ApiResponse::success($this->planService->getAllPlans(), 'Plans retrieved successfully');
    }

    public function subscribe(SubscribePlanRequest $request): JsonResponse
    {
        $subscription = $this->planService->subscribe(
            auth()->user()->id,
            $request->integer('plan_id')
        );

        return ApiResponse::success($subscription->load('plan'), 'Subscription created successfully', 201);
    }

    public function upgrade(UpgradePlanRequest $request): JsonResponse
    {
        $result = $this->planService->upgrade(
            auth()->user()->id,
            $request->integer('plan_id')
        );

        return ApiResponse::success($result, 'Plan upgraded successfully', 201);
    }

    public function cancel(): JsonResponse
    {
        $subscription = $this->planService->cancel(auth()->user()->id);

        return ApiResponse::success($subscription->load('plan'), 'Subscription cancelled successfully');
    }

    public function subscription(): JsonResponse
    {
        $subscription = $this->planService->subscription(auth()->user()->id);

        return ApiResponse::success($subscription, 'Subscription retrieved successfully');
    }
}
