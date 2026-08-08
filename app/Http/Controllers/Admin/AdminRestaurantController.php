<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminRestaurantController extends Controller
{
    public function index()
    {
        return JsonResource::collection(Restaurant::paginate(15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'cuisine' => 'required|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'destination_id' => 'required|exists:destinations,id',
        ]);

        $restaurant = Restaurant::create($validated);
        return new JsonResource($restaurant);
    }

    public function show($id)
    {
        return new JsonResource(Restaurant::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $restaurant = Restaurant::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'cuisine' => 'sometimes|string|max:255',
            'rating' => 'sometimes|integer|min:1|max:5',
            'destination_id' => 'sometimes|exists:destinations,id',
        ]);

        $restaurant->update($validated);
        return new JsonResource($restaurant);
    }

    public function destroy($id)
    {
        $restaurant = Restaurant::findOrFail($id);
        $restaurant->delete();
        return response()->json(['success' => true]);
    }
}
