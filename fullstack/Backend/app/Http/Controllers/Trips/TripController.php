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

        if ($request->has('is_public') || $request->has('public') || $request->input('scope') === 'public') {
            $query = Trip::where('is_public', true)
                ->with(['destinations', 'user'])
                ->latest();
        } else if ($request->user()) {
            $query = Trip::where('user_id', $request->user()->id)
                ->with(['destinations'])
                ->latest();
        } else {
            $query = Trip::where('is_public', true)
                ->with(['destinations', 'user'])
                ->latest();
        }

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
            'is_public' => $data['is_public'] ?? false,
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

    public function update(Request $request, Trip $trip): JsonResponse
    {
        if (Gate::forUser($request->user())->denies('update', $trip) && Gate::forUser($request->user())->denies('view', $trip)) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'travel_style' => 'sometimes|string|max:100',
            'no_of_travelers' => 'sometimes|integer|min:1',
            'budget' => 'sometimes|numeric|min:0',
            'start_date' => 'sometimes|nullable|date',
            'end_date' => 'sometimes|nullable|date',
            'no_of_days' => 'sometimes|integer|min:1',
            'is_public' => 'sometimes|boolean',
            'description' => 'sometimes|nullable|string',
        ]);

        $statusVal = is_object($trip->status) ? $trip->status->value : (string) $trip->status;
        $isLocked = in_array(strtolower($statusVal), ['booked', 'completed', 'paid']);
        $modifiesItinerary = $request->hasAny(['title', 'travel_style', 'no_of_travelers', 'budget', 'start_date', 'end_date', 'no_of_days']);

        if ($isLocked && $modifiesItinerary) {
            return ApiResponse::fail('This trip is booked & paid and its itinerary details cannot be edited.', 'trip_locked', 403);
        }

        $trip->update($validated);

        return ApiResponse::success(new TripResource($trip->fresh()), 'Trip details updated successfully');
    }

    public function attach(Request $request, Trip $trip, string $type): JsonResponse
    {
        if (Gate::forUser($request->user())->denies('view', $trip)) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        $statusVal = is_object($trip->status) ? $trip->status->value : (string) $trip->status;
        if (in_array(strtolower($statusVal), ['booked', 'completed', 'paid'])) {
            return ApiResponse::fail('This trip is booked & paid and cannot be modified.', 'trip_locked', 403);
        }

        // Normalize type (singular/plural, case-insensitive, alias mapping)
        $normalizedType = strtolower(trim($type));
        if ($normalizedType === 'airports' || $normalizedType === 'airport') {
            $normalizedType = 'flight';
        } else {
            $normalizedType = rtrim($normalizedType, 's');
        }

        $allowedTypes = ['hotel', 'flight', 'restaurant', 'attraction', 'destination'];
        if (! in_array($normalizedType, $allowedTypes)) {
            return ApiResponse::fail('Invalid attachment type. Allowed types: '.implode(', ', $allowedTypes), 'invalid_type', 400);
        }

        $itemId = $request->input('item_id') ?? $request->input('id');
        if (! $itemId || ! is_numeric($itemId)) {
            return ApiResponse::fail('Item ID is required', 'validation_error', 422);
        }

        $itemId = (int) $itemId;
        $relation = $normalizedType === 'destination' ? 'destinations' : $normalizedType.'s';

        // Check if item exists
        $modelClass = 'App\\Models\\Catalog\\'.ucfirst($normalizedType);
        if (! class_exists($modelClass) || ! $modelClass::find($itemId)) {
            return ApiResponse::fail(ucfirst($normalizedType).' not found', 'not_found', 404);
        }

        // Check if already attached
        if ($trip->$relation()->where($modelClass::make()->getTable().'.id', $itemId)->exists()) {
            return ApiResponse::fail(ucfirst($normalizedType).' is already attached to this trip', 'already_attached', 409);
        }

        $dayNumber = max(1, (int) ($request->input('day_number') ?? $request->input('day') ?? 1));

        if ($normalizedType === 'destination') {
            $trip->destinations()->attach($itemId, [
                'day_number' => $dayNumber,
                'visit_order' => 1,
            ]);
        } else {
            $trip->$relation()->attach($itemId);
            $itemModel = $modelClass::find($itemId);
            if ($itemModel) {
                \App\Models\Trips\ItineraryItem::updateOrCreate([
                    'trip_id' => $trip->id,
                    'itemable_type' => $normalizedType,
                    'itemable_id' => $itemId,
                ], [
                    'day_number' => $dayNumber,
                    'item_order' => 1,
                    'type' => $normalizedType,
                    'time_slot' => '10:00 AM',
                    'title' => $itemModel->name ?? $itemModel->title ?? ucfirst($normalizedType),
                    'notes' => 'Attached to Day '.$dayNumber,
                    'estimated_cost' => $itemModel->price_per_night ?? $itemModel->price ?? $itemModel->average_price ?? $itemModel->entry_fee ?? 0,
                ]);
            }
        }

        return ApiResponse::success(null, ucfirst($normalizedType).' attached to trip Day '.$dayNumber.' successfully');
    }

    public function detach(Request $request, Trip $trip, int $itemId): JsonResponse
    {
        if (Gate::forUser($request->user())->denies('view', $trip)) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        $statusVal = is_object($trip->status) ? $trip->status->value : (string) $trip->status;
        if (in_array(strtolower($statusVal), ['booked', 'completed', 'paid'])) {
            return ApiResponse::fail('This trip is booked & paid and cannot be modified.', 'trip_locked', 403);
        }

        $detached = false;
        $relations = ['hotels', 'flights', 'restaurants', 'attractions', 'destinations'];

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

    public function updateItem(Request $request, Trip $trip, int $itemId): JsonResponse
    {
        if (Gate::forUser($request->user())->denies('view', $trip)) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        $statusVal = is_object($trip->status) ? $trip->status->value : (string) $trip->status;
        if (in_array(strtolower($statusVal), ['booked', 'completed', 'paid'])) {
            return ApiResponse::fail('This trip is booked & paid and cannot be modified.', 'trip_locked', 403);
        }

        $validated = $request->validate([
            'day_number' => 'sometimes|integer|min:1',
            'title' => 'sometimes|string|max:255',
            'time_slot' => 'sometimes|nullable|string|max:100',
            'notes' => 'sometimes|nullable|string',
            'estimated_cost' => 'sometimes|numeric|min:0',
        ]);

        $item = $trip->itineraryItems()->where(function ($q) use ($itemId) {
            $q->where('id', $itemId)->orWhere('itemable_id', $itemId);
        })->first();

        if ($item) {
            $item->update($validated);
        } else {
            if ($trip->destinations()->where('destinations.id', $itemId)->exists() && isset($validated['day_number'])) {
                $trip->destinations()->updateExistingPivot($itemId, ['day_number' => $validated['day_number']]);
            }
        }

        return ApiResponse::success(null, 'Itinerary item updated successfully');
    }
}
