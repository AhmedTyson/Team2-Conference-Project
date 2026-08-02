<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Http\Resources\RestaurantResource;
use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    
    public function index()
    {
        $restaurants = Restaurant::with(['destination', 'category'])->get();

        return RestaurantResource::collection($restaurants);
    }

    public function show($id)
    {
        $restaurant = Restaurant::with(['destination', 'category'])->findOrFail($id);

        return new RestaurantResource($restaurant);
    }
}