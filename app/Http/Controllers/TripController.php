<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTripRequest;
use App\Http\Resources\TripResource;
use App\Models\Attraction;
use App\Models\Destination;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TripController extends Controller
{
    private const ATTACHABLE_TYPES = [
        'hotels' => Hotel::class,
        'restaurants' => Restaurant::class,
        'attractions' => Attraction::class,
        'flights' => Flight::class,
    ];
    public function create(Request $request)
    {
        $destinations = Destination::query()
            ->select('id', 'name', 'city_name', 'image')
            ->orderBy('name')
            ->get();

        return response()->json([
            "success" => true,
            "message" => "Trip creation data retrieved successfully.",
            "data" => [
                "destinations" => $destinations,
                "travel_styles" => ['solo', 'couple', 'family', 'friends', 'business'],
                "budget_levels" => ['low', 'medium', 'high'],
            ],
        ]);
    }

    public function store(StoreTripRequest $request)
    {
        $trip = Trip::create($request->validated() + [
            "user_id" => $request->user()->id,
            "status" => "pending",
        ]);

        return response()->json([
            "success" => true,
            "message" => "Trip created successfully.",
            "data" => new TripResource($trip),
        ], 201);
    }

    public function show(Request $request, Trip $trip)
    {
        if ($trip->user_id !== $request->user()->id) {
            return response()->json([
                "success" => false,
                "message" => "Trip not found or does not belong to this user.",
            ], 404);
        }


        $trip->load(['itineraryItems.itemable', 'destinations']);

        return response()->json([
            "success" => true,
            "message" => "Trip retrieved successfully.",
            "data" => new TripResource($trip),
        ]);
    }

    public function attach(Request $request, Trip $trip, string $type)
    {
        if ($trip->user_id !== $request->user()->id) {
            return response()->json([
                "success" => false,
                "message" => "Trip not found or does not belong to this user.",
            ], 404);
        }

        $modelClass = self::ATTACHABLE_TYPES[$type] ?? null;

        if ($modelClass === null) {
            return response()->json([
                "success" => false,
                "message" => "Invalid item type.",
                "errors" => [
                    "type" => ["The selected type is not supported."],
                ],
            ], 422);
        }

        $validated = $request->validate([
            'id' => ['required', 'integer'],
        ]);

        if (!$modelClass::whereKey($validated['id'])->exists()) {
            return response()->json([
                "success" => false,
                "message" => "Item not found.",
            ], 404);
        }

        $alreadyAttached = $trip->{$type}()
            ->wherePivot('item_id', $validated['id'])
            ->exists();

        $message = "Item attached to trip successfully.";

        if (!$alreadyAttached) {
            $trip->{$type}()->attach($validated['id']);
        } else {
            $message = "Item is already attached to this trip.";
        }

        return response()->json([
            "success" => true,
            "message" => $message,
            "data" => new TripResource($trip),
        ]);
    }

    public function detach(Request $request, Trip $trip, string $id)
    {
        if ($trip->user_id !== $request->user()->id) {
            return response()->json([
                "success" => false,
                "message" => "Trip not found or does not belong to this user.",
            ], 404);
        }

        $deleted = DB::table('trip_items')
            ->where('id', (int) $id)
            ->where('trip_id', $trip->id)
            ->delete();

        if ($deleted === 0) {
            return response()->json([
                "success" => false,
                "message" => "Item not found on this trip.",
            ], 404);
        }

        return response()->json([
            "success" => true,
            "message" => "Item detached from trip successfully.",
            "data" => new TripResource($trip),
        ]);
    }
}