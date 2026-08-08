<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRestaurantRequest;
use App\Http\Requests\UpdateRestaurantRequest;
use App\Models\Restaurant;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminRestaurantController extends Controller
{
    public function index()
    {
        return JsonResource::collection(Restaurant::paginate(min((int) request('per_page', 15) ?: 15, 100)));
    }

    public function store(StoreRestaurantRequest $request)
    {
        $validated = $request->validated();

        $restaurant = Restaurant::create($validated);

        return new JsonResource($restaurant);
    }

    public function show($id)
    {
        return new JsonResource(Restaurant::findOrFail($id));
    }

    public function update(UpdateRestaurantRequest $request, $id)
    {
        $restaurant = Restaurant::findOrFail($id);

        $validated = $request->validated();

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
