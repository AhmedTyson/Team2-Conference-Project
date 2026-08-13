<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreRestaurantRequest;
use App\Http\Requests\Catalog\UpdateRestaurantRequest;
use App\Models\Catalog\Restaurant;
use App\Services\Catalog\RestaurantService;
use App\Support\ApiResponse;
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
        $restaurants = $this->restaurantService->getAdminList(request('trashed') === '1');

        return JsonResource::collection($restaurants);
    }

    public function store(StoreRestaurantRequest $request)
    {
        $restaurant = $this->restaurantService->store($request->validated());

        return (new JsonResource($restaurant))->response()->setStatusCode(201);
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

    public function destroy($id): JsonResponse
    {
        $this->restaurantService->destroy($id);

        return ApiResponse::success(null, 'Restaurant deleted successfully');
    }

    public function restore($id): JsonResponse
    {
        Restaurant::onlyTrashed()->findOrFail($id)->restore();

        return ApiResponse::success(null, 'Restaurant restored successfully.');
    }
}
