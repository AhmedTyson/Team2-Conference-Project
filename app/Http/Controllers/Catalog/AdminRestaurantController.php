<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreRestaurantRequest;
use App\Http\Requests\Catalog\UpdateRestaurantRequest;
use App\Services\Catalog\RestaurantService;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminRestaurantController extends Controller
{
    protected $restaurantService;

    public function __construct(RestaurantService $restaurantService)
    {
        $this->restaurantService = $restaurantService;
    }

    public function index()
    {
        $restaurants = $this->restaurantService->getAdminList();
        return JsonResource::collection($restaurants);
    }

    public function store(StoreRestaurantRequest $request)
    {
        $restaurant = $this->restaurantService->store($request->validated());
        return new JsonResource($restaurant);
    }

    public function show($id)
    {
        $restaurant = $this->restaurantService->showAdmin($id);
        return new JsonResource($restaurant);
    }

    public function update(UpdateRestaurantRequest $request, $id)
    {
        $restaurant = $this->restaurantService->update($id, $request->validated());
        return new JsonResource($restaurant);
    }

    public function destroy($id)
    {
        $this->restaurantService->destroy($id);
        return response()->json(['success' => true]);
    }
}
