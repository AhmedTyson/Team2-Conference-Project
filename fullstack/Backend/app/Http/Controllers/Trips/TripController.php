<?php

namespace App\Http\Controllers\Trips;

use App\Enums\TripStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Trips\StoreTripRequest;
use App\Http\Resources\TripResource;
use App\Models\Trips\Trip;
use App\Services\Trips\TripForkService;
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

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 20) ?: 20, 100);
        $query = Trip::where('user_id', $request->user()->id)
            ->with(['destinations'])
            ->latest();

        if ($request->has('page') || $request->has('per_page')) {
            $trips = $query->paginate($perPage);
            return ApiResponse::success(TripResource::collection($trips), 'Trips retrieved successfully');
        }

        return ApiResponse::success(TripResource::collection($query->get()), 'Trips retrieved successfully');
    }

    public function creationData(Request $request): JsonResponse
    {
        $data = $this->tripService->getCreationData();

        return ApiResponse::success($data, 'Trip creation data retrieved successfully');
    }

    public function store(StoreTripRequest $request): JsonResponse
    {
        $data = $request->validated();
        if (empty($data['travel_style'])) {
            $data['travel_style'] = 'cultural';
        }

        $trip = $this->tripService->store($data + [
            'user_id' => $request->user()->id,
            'status' => TripStatus::PENDING->value,
            'no_of_travelers' => $data['no_of_travelers'] ?? 1,
            'no_of_days' => $data['no_of_days'] ?? 3,
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
        if (Gate::forUser($request->user())->denies('fork', $trip)) {
            return ApiResponse::fail('You are not authorized to fork this trip', 'forbidden', 403);
        }

        try {
            $forkedTrip = app(TripForkService::class)->fulfillFork($request->user()->id, $trip->id);

            return ApiResponse::success(new TripResource($forkedTrip), 'Trip forked successfully', 201);
        } catch (\Exception $e) {
            return ApiResponse::fail($e->getMessage(), 'fork_failed', 400);
        }
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
