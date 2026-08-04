<?php

namespace App\Http\Controllers;

use App\Http\Resources\HotelResource;
use App\Models\Hotel;
use Illuminate\Http\Request;

class HotelController extends Controller
{
    // List all hotels with pagination
public function index()
{
    $hotels = Hotel::with('destination')->paginate(10);

    return HotelResource::collection($hotels);
}
    // Show a single hotel
    public function show($id)
    {
        $hotel = Hotel::with('destination')->findOrFail($id);

        return new HotelResource($hotel);
    }

    // Create a new hotel
    public function store(Request $request)
    {
        $hotel = Hotel::create($request->all());

        return response()->json([
            'message' => 'Hotel created successfully',
            'data' => new HotelResource($hotel)
        ], 201);
    }

    // Update a hotel
    public function update(Request $request, $id)
    {
        $hotel = Hotel::findOrFail($id);

        $hotel->update($request->all());

        return response()->json([
            'message' => 'Hotel updated successfully',
            'data' => new HotelResource($hotel)
        ]);
    }

    // Delete a hotel
    public function destroy($id)
    {

        $hotel = Hotel::findOrFail($id);

        $hotel->delete();

        return response()->json([
            'message' => 'Hotel deleted successfully'
        ]);
    }
}