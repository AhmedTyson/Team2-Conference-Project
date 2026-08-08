<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminSetPlansRequest;
use App\Http\Requests\SubscribePlanRequest;
use App\Http\Requests\UpgradePlanRequest;
use App\Services\PlanService;
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

        return response()->json(['success' => true, 'data' => $plans], 200);
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->planService->getAllPlans(),
        ]);
    }

    public function subscribe(SubscribePlanRequest $request): JsonResponse
    {
        $subscription = $this->planService->subscribe(
            auth()->user()->id,
            $request->integer('plan_id')
        );

        return response()->json(['success' => true, 'data' => $subscription->load('plan')], 201);
    }

    public function upgrade(UpgradePlanRequest $request): JsonResponse
    {
        $result = $this->planService->upgrade(
            auth()->user()->id,
            $request->integer('plan_id')
        );

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function cancel(): JsonResponse
    {
        $subscription = $this->planService->cancel(auth()->user()->id);

        return response()->json(['success' => true, 'data' => $subscription->load('plan')]);
    }

    public function subscription(): JsonResponse
    {
        $subscription = $this->planService->subscription(auth()->user()->id);

        return response()->json([
            'success' => true,
            'data' => $subscription,
        ]);
    }
}
