<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminHotelController extends Controller
{
    public function index()
    {
        return JsonResource::collection(Hotel::paginate(min((int) request("per_page", 15) ?: 15, 100)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'stars' => 'required|integer|min:1|max:5',
            'price_per_night' => 'required|integer|min:0',
            'availability' => 'required|string',
            'destination_id' => 'required|exists:destinations,id',
        ]);

        $hotel = Hotel::create($validated);
        return new JsonResource($hotel);
    }

    public function show($id)
    {
        return new JsonResource(Hotel::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $hotel = Hotel::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'stars' => 'sometimes|integer|min:1|max:5',
            'price_per_night' => 'sometimes|integer|min:0',
            'availability' => 'sometimes|string',
            'destination_id' => 'sometimes|exists:destinations,id',
        ]);

        $hotel->update($validated);
        return new JsonResource($hotel);
    }

    public function destroy($id)
    {
        $hotel = Hotel::findOrFail($id);
        $hotel->delete();
        return response()->json(['success' => true]);
    }
}
