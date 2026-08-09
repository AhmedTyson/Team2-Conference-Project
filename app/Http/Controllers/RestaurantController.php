<?php

namespace App\Http\Controllers;

use App\Http\Resources\RestaurantResource;
use App\Services\RestaurantService;
use App\Models\Restaurant;

class RestaurantController extends Controller
{
    protected $restaurantService;

    public function __construct(RestaurantService $restaurantService)
    {
        $this->restaurantService = $restaurantService;
    }

    public function index()
    {
        $restaurants = $this->restaurantService->getPublicList();
        return RestaurantResource::collection($restaurants);
    }

    public function show($id)
    {
        $restaurant = $this->restaurantService->showPublic($id);
        return new RestaurantResource($restaurant);
    }

    public function destroy($id)
    {
        authorize('delete', Restaurant::class);
        $this->restaurantService->destroy($id);
        return response()->json(['message' => 'Restaurant deleted successfully']);
    }
}
