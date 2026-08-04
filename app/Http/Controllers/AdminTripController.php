<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\TripResource;
use App\Models\Trip;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTripController extends Controller
{
    // View all trips
    public function index()
    {
        $trips = Trip::latest()->get();

        return TripResource::collection($trips);
    }

    // Edit a trip
    public function update(Request $request, int $id): JsonResponse
    {
        $trip = Trip::findOrFail($id);

        $trip->update([
            'title' => $request->title ?? $trip->title,
            'travel_style' => $request->travel_style ?? $trip->travel_style,
            'interests' => $request->interests ?? $trip->interests,
            'no_of_travelers' => $request->no_of_travelers ?? $trip->no_of_travelers,
            'budget' => $request->budget ?? $trip->budget,
            'no_of_days' => $request->no_of_days ?? $trip->no_of_days,
            'start_date' => $request->start_date ?? $trip->start_date,
            'end_date' => $request->end_date ?? $trip->end_date,
            'status' => $request->status ?? $trip->status,
            'estimated_cost' => $request->estimated_cost ?? $trip->estimated_cost,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Trip updated successfully.',
            'data'    => new TripResource($trip)
        ]);
    }

    //Delete a trip
    public function destroy(int $id): JsonResponse
    {
        $trip = Trip::findOrFail($id);
        $trip->delete();

        return response()->json([
            'success' => true,
            'message' => 'Trip deleted successfully.'
        ]);
    }
}