<?php

namespace App\Http\Controllers\Trips;

use App\Http\Controllers\Controller;
use App\Http\Requests\Trips\StoreTripRequest;
use App\Http\Requests\Trips\UpdateTripRequest;
use App\Http\Resources\TripResource;
use App\Models\Trips\Trip;
use App\Services\Trips\TripService;
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
        $trips = $this->tripService->getAdminList(request('trashed') === '1');
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

    public function restore(int $id): JsonResponse
    {
        Trip::onlyTrashed()->findOrFail($id)->restore();

        return response()->json([
            'success' => true,
            'message' => 'Trip restored successfully.',
        ]);
    }
}
