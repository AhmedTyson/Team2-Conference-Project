<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTripRequest;
use App\Http\Requests\UpdateTripRequest;
use App\Http\Resources\TripResource;
use App\Services\TripService;
use Illuminate\Http\JsonResponse;

class AdminTripController extends Controller
{
    protected $tripService;

    public function __construct(TripService $tripService)
    {
        $this->tripService = $tripService;
    }

    public function index()
    {
        $trips = $this->tripService->getAdminList();
        return TripResource::collection($trips);
    }

    public function store(StoreTripRequest $request): JsonResponse
    {
        $trip = $this->tripService->store($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Trip created successfully',
            'data' => new TripResource($trip),
        ]);
    }

    public function update(UpdateTripRequest $request, int $id): JsonResponse
    {
        $trip = $this->tripService->update($id, $request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Trip updated successfully.',
            'data' => new TripResource($trip),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->tripService->destroy($id);
        return response()->json([
            'success' => true,
            'message' => 'Trip deleted successfully.',
        ]);
    }
}
