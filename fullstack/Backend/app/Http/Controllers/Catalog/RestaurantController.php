<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\RestaurantResource;
use App\Services\Catalog\RestaurantService;

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
}
