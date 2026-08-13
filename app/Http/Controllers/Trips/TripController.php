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
use Illuminate\Support\Facades\Gate;

class TripController extends Controller
{
    protected $tripService;

    public function __construct(TripService $tripService)
    {
        $this->tripService = $tripService;
    }

    public function create(Request $request): JsonResponse
    {
        $data = $this->tripService->getCreationData();

        return ApiResponse::success($data, 'Trip creation data retrieved successfully');
    }

    public function store(StoreTripRequest $request): JsonResponse
    {
        $trip = $this->tripService->store($request->validated() + [
            'user_id' => $request->user()->id,
            'status' => 'pending',
        ]);

        return ApiResponse::success(new TripResource($trip), 'Trip created successfully', 201);
    }

    public function show(Request $request, Trip $trip): JsonResponse
    {
        if (Gate::forUser($request->user())->denies('view', $trip)) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        $trip->load(['itineraryItems.itemable', 'destinations']);

        return ApiResponse::success(new TripResource($trip), 'Trip retrieved successfully');
    }

    public function fork(Request $request, Trip $trip): JsonResponse
    {
        abort(400, 'Direct trip forking is disabled. Please use the /api/checkout/initiate endpoint to purchase a trip fork.');
    }

    public function attach(Request $request, Trip $trip, string $type): JsonResponse
    {
        if (Gate::forUser($request->user())->denies('view', $trip)) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        $allowedTypes = ['hotel', 'flight', 'restaurant', 'attraction'];
        if (! in_array($type, $allowedTypes)) {
            return ApiResponse::fail('Invalid attachment type. Allowed types: '.implode(', ', $allowedTypes), 'invalid_type', 400);
        }

        $validated = $request->validate([
            'item_id' => 'required|integer',
        ]);

        $itemId = $validated['item_id'];
        $relation = $type.'s';

        // Check if item exists
        $modelClass = 'App\\Models\\Catalog\\'.ucfirst($type);
        if (! class_exists($modelClass) || ! $modelClass::find($itemId)) {
            return ApiResponse::fail(ucfirst($type).' not found', 'not_found', 404);
        }

        // Check if already attached. Using DB table explicitly if possible, or just relationship exist check.
        // Easiest is to query relationship
        if ($trip->$relation()->where($modelClass::make()->getTable().'.id', $itemId)->exists()) {
            return ApiResponse::fail(ucfirst($type).' is already attached to this trip', 'already_attached', 409);
        }

        $trip->$relation()->attach($itemId);

        return ApiResponse::success(null, ucfirst($type).' attached to trip successfully');
    }

    public function detach(Request $request, Trip $trip, int $itemId): JsonResponse
    {
        if (Gate::forUser($request->user())->denies('view', $trip)) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        $detached = false;
        $relations = ['hotels', 'flights', 'restaurants', 'attractions'];

        foreach ($relations as $relation) {
            if ($trip->$relation()->detach($itemId)) {
                $detached = true;
                break;
            }
        }

        if (! $detached) {
            return ApiResponse::fail('Item not found attached to this trip', 'not_found', 404);
        }

        return ApiResponse::success(null, 'Item detached from trip successfully');
    }
}
