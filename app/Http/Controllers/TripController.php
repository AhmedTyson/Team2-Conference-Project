<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTripRequest;
use App\Http\Resources\TripResource;
use App\Models\Trip;
use App\Services\TripService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TripController extends Controller
{
    protected $tripService;

    public function __construct(TripService $tripService)
    {
        $this->tripService = $tripService;
    }

    public function create(Request $request)
    {
        $data = $this->tripService->getCreationData();

        return response()->json([
            'success' => true,
            'message' => 'Trip creation data retrieved successfully.',
            'data' => $data,
        ]);
    }

    public function store(StoreTripRequest $request)
    {
        $trip = $this->tripService->store($request->validated() + [
            'user_id' => $request->user()->id,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Trip created successfully.',
            'data' => new TripResource($trip),
        ], 201);
    }

    public function show(Request $request, Trip $trip)
    {
        if ($trip->user_id !== $request->user()->id) {
            return ApiResponse::fail(
                'Trip not found or does not belong to this user.',
                'not_found',
                404
            );
        }

        $trip->load(['itineraryItems.itemable', 'destinations']);

        return response()->json([
            'success' => true,
            'message' => 'Trip retrieved successfully.',
            'data' => new TripResource($trip),
        ]);
    }

    public function fork(Request $request, Trip $trip): JsonResponse
    {
        abort(400, 'Direct trip forking is disabled. Please use the /api/v1/checkout/initiate endpoint to purchase a trip fork.');
    }
}
