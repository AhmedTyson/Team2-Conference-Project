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
    $sourceTrip = $trip->load(['tripDestinations', 'hotels', 'attractions', 'restaurants']);
 
    $newTrip = DB::transaction(function () use ($sourceTrip, $request) {
 
        // 1) Copy the trip's basic info
        $trip = Trip::create([
            'user_id'         => $request->user()->id,
            'title'           => $sourceTrip->title . ' (Forked)',
            'travel_style'    => $sourceTrip->travel_style,
            'interests'       => $sourceTrip->interests,
            'no_of_travelers' => $sourceTrip->no_of_travelers,
            'budget'          => $sourceTrip->budget,
            'no_of_days'      => $sourceTrip->no_of_days,
            'start_date'      => $sourceTrip->start_date,
            'end_date'        => $sourceTrip->end_date,
            'estimated_cost'  => $sourceTrip->estimated_cost,
            'status'          => 'pending',
        ]);
 
        // 2) Copy tripDestinations (the "days")
        foreach ($sourceTrip->tripDestinations as $destination) {
            $trip->tripDestinations()->create([
                'destination_id' => $destination->destination_id,
                'day_number'     => $destination->day_number,
                'visit_order'    => $destination->visit_order,
                'estimated_date' => $destination->estimated_date,
                'notes'          => $destination->notes,
            ]);
        }
 
        // 3) Copy trip_items (hotels, attractions, restaurants)
        $trip->hotels()->attach($sourceTrip->hotels->pluck('id'));
        $trip->attractions()->attach($sourceTrip->attractions->pluck('id'));
        $trip->restaurants()->attach($sourceTrip->restaurants->pluck('id'));
 
        return $trip;
    });
 
    $newTrip->load(['tripDestinations', 'hotels', 'attractions', 'restaurants']);
 
    return response()->json([
        'success' => true,
        'message' => 'Trip forked successfully to your account.',
        'data'    => new TripResource($newTrip),
    ], 201);
}
}