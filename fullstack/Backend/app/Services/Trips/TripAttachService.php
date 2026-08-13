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

        // Check if already attached
        if ($trip->$relation()->where($modelClass::make()->getTable().'.id', $itemId)->exists()) {
            return ApiResponse::fail(ucfirst($type).' is already attached to this trip', 'already_attached', 409);
        }

        $trip->$relation()->attach($itemId);

        return ApiResponse::success(null, ucfirst($type).' attached to trip successfully');
    }
}