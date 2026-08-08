<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TripResource;
use App\Models\Trip;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\StoreTripRequest;
use App\Http\Requests\UpdateTripRequest;

class AdminTripController extends Controller
{
    // View all trips
    public function index()
    {
        $trips = Trip::with(['user', 'destinations'])->latest()->paginate(min((int) request("per_page", 15) ?: 15, 100));

        return TripResource::collection($trips);
    }

    public function store(StoreTripRequest $request): JsonResponse
    {
        $trip = Trip::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Trip created successfully',
            'data' => new TripResource($trip)
        ]);
    }

    // Edit a trip
    public function update(UpdateTripRequest $request, int $id): JsonResponse
    {
        $trip = Trip::findOrFail($id);
        $trip->update($request->validated());

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