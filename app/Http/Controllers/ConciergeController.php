<?php

namespace App\Http\Controllers;

use App\Models\Trips\Trip;
use App\Services\ConciergeService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ConciergeController extends Controller
{
    public function __construct(
        private ConciergeService $conciergeService
    ) {}

    public function ask(Request $request, Trip $trip): JsonResponse
    {
        if (Gate::forUser($request->user())->denies('view', $trip)) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $response = $this->conciergeService->ask(
            $trip,
            $request->message
        );

        return ApiResponse::success(['response' => $response], 'Concierge response generated successfully');
    }
}
