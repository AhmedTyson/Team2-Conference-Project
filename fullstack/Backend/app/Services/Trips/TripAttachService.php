<?php

namespace App\Services\Trips;

use App\Enums\OrderStatus;
use App\Models\Catalog\Attraction;
use App\Models\Catalog\Flight;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Restaurant;
use App\Models\Trips\Trip;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TripAttachService
{
    public function attach(Request $request, Trip $trip, string $type): ApiResponse
    {
        if (Gate::forUser($request->user())->denies('view', $trip)) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
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
}