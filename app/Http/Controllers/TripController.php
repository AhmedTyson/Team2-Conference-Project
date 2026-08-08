<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTripRequest;
use App\Http\Resources\TripResource;
use App\Models\Destination;
use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class TripController extends Controller
{
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

public function fork(Request $request, Trip $trip): JsonResponse
{
    abort(400, 'Direct trip forking is disabled. Please use the /api/v1/checkout/initiate endpoint to purchase a trip fork.');
}
}