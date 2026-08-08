<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Http\Resources\RestaurantResource;
use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    
   public function index()
{
    $restaurants = Restaurant::with(['destination', 'category'])
        ->paginate(10);

    return RestaurantResource::collection($restaurants);
}
    public function show($id)
    {
        $restaurant = Restaurant::with(['destination', 'category'])->findOrFail($id);

        return new RestaurantResource($restaurant);
    }
    public function destroy($id)
    {
        //restaurant policy
        authorize('delete', Restaurant::class);
        $restaurant = Restaurant::findOrFail($id);

        $restaurant->delete();

        return response()->json([
            'message' => 'Restaurant deleted successfully'
        ]);
    }
}