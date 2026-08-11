<?php

namespace App\Http\Controllers\Trips;

use App\Http\Controllers\Controller;
use App\Http\Requests\Trips\StoreTripRequest;
use App\Http\Resources\TripResource;
use App\Models\Trips\Trip;
use App\Services\Trips\TripService;
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
            return ApiResponse::fail('Trip not found or does not belong to this user.', 'not_found', 404);
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

    public function attach(Request $request, Trip $trip, string $type): JsonResponse
    {
        if ($trip->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Trip not found',
            ], 404);
        }

        $allowedTypes = ['hotel', 'flight', 'restaurant', 'attraction'];
        if (!in_array($type, $allowedTypes)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid attachment type. Allowed types: ' . implode(', ', $allowedTypes),
            ], 400);
        }

        $validated = $request->validate([
            'item_id' => 'required|integer',
        ]);

        $itemId = $validated['item_id'];
        $relation = $type . 's';

        // Check if item exists
        $modelClass = 'App\\Models\\Catalog\\' . ucfirst($type);
        if (!class_exists($modelClass) || !$modelClass::find($itemId)) {
            return response()->json([
                'success' => false,
                'message' => ucfirst($type) . ' not found',
            ], 404);
        }

        // Check if already attached. Using DB table explicitly if possible, or just relationship exist check.
        // Easiest is to query relationship
        if ($trip->$relation()->where($modelClass::make()->getTable() . '.id', $itemId)->exists()) {
            return response()->json([
                'success' => false,
                'message' => ucfirst($type) . ' is already attached to this trip',
            ], 409);
        }

        $trip->$relation()->attach($itemId);

        return response()->json([
            'success' => true,
            'message' => ucfirst($type) . ' attached to trip successfully.',
        ], 200);
    }

    public function detach(Request $request, Trip $trip, int $itemId): JsonResponse
    {
        if ($trip->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Trip not found',
            ], 404);
        }

        $detached = false;
        $relations = ['hotels', 'flights', 'restaurants', 'attractions'];

        foreach ($relations as $relation) {
            if ($trip->$relation()->detach($itemId)) {
                $detached = true;
                break;
            }
        }

        if (!$detached) {
            return response()->json([
                'success' => false,
                'message' => 'Item not found attached to this trip',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Item detached from trip successfully.',
        ], 200);
    }
}
