<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\HotelResource;
use App\Models\Hotel;
use Illuminate\Http\Request;

class AdminHotelController extends Controller
{
    public function index()
    {
        return HotelResource::collection(Hotel::with('destination')->paginate(10));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'destination_id' => 'required|exists:destinations,id',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'price_per_night' => 'nullable|numeric|min:0',
            'rating' => 'nullable|numeric|between:0,5',
            'stars' => 'nullable|integer|between:1,5',
            'availability' => 'nullable|string|max:50',
            'image' => 'nullable|string',
        ]);

        $hotel = Hotel::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Hotel created successfully',
            'data' => new HotelResource($hotel),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $hotel = Hotel::findOrFail($id);

        $validated = $request->validate([
            'destination_id' => 'required|exists:destinations,id',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'price_per_night' => 'nullable|numeric|min:0',
            'rating' => 'nullable|numeric|between:0,5',
            'stars' => 'nullable|integer|between:1,5',
            'availability' => 'nullable|string|max:50',
            'image' => 'nullable|string',
        ]);

        $hotel->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Hotel updated successfully',
            'data' => new HotelResource($hotel),
        ]);
    }

    public function destroy($id)
    {
        $hotel = Hotel::findOrFail($id);

        $hotel->delete();

        return response()->json([
            'success' => true,
            'message' => 'Hotel deleted successfully',
        ]);
    }
}