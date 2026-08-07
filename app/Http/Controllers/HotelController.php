<?php

namespace App\Http\Controllers;

use App\Http\Resources\HotelResource;
use App\Models\Hotel;
use App\Services\HotelService;
use Illuminate\Http\Request;

class HotelController extends Controller
{
    protected $hotelService;

    public function __construct(HotelService $hotelService)
    {
        $this->hotelService = $hotelService;
    }

    // List all hotels
    public function index()
    {
        return HotelResource::collection($this->hotelService->index());
    }

    // Show a single hotel
    public function show($id)
    {
        return new HotelResource($this->hotelService->show($id));
    }

    // Create a new hotel
    public function store(Request $request)
    {
        $hotel = $this->hotelService->store($request->all());

        return response()->json([
            'message' => 'Hotel created successfully',
            'data' => new HotelResource($hotel)
        ], 201);
    }

    // Update a hotel
    public function update(Request $request, $id)
    {
        $hotel = $this->hotelService->update($id, $request->all());

        return response()->json([
            'message' => 'Hotel updated successfully',
            'data' => new HotelResource($hotel)
        ]);
    }

    // Delete a hotel
    public function destroy($id)
    {
        $this->hotelService->destroy($id);

        return response()->json([
            'message' => 'Hotel deleted successfully'
        ]);
    }
}