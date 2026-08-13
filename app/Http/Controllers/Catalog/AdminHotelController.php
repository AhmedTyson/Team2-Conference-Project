<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreHotelRequest;
use App\Http\Requests\Catalog\UpdateHotelRequest;
use App\Models\Catalog\Hotel;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminHotelController extends Controller
{
    public function index()
    {
        $query = Hotel::query();

        if (request('trashed') === '1') {
            $query->onlyTrashed();
        }

        return JsonResource::collection($query->paginate(min((int) request('per_page', 15) ?: 15, 100)));
    }

    public function store(StoreHotelRequest $request)
    {
        $validated = $request->validated();

        $hotel = Hotel::create($validated);

        return (new JsonResource($hotel))->response()->setStatusCode(201);
    }

    public function show($id)
    {
        return new JsonResource(Hotel::findOrFail($id));
    }

    public function update(UpdateHotelRequest $request, $id)
    {
        $hotel = Hotel::findOrFail($id);

        $validated = $request->validated();

        $hotel->update($validated);

        return new JsonResource($hotel);
    }

    public function destroy($id): JsonResponse
    {
        $hotel = Hotel::findOrFail($id);
        $hotel->delete();

        return ApiResponse::success(null, 'Hotel deleted successfully');
    }

    public function restore($id): JsonResponse
    {
        Hotel::onlyTrashed()->findOrFail($id)->restore();

        return ApiResponse::success(null, 'Hotel restored successfully.');
    }
}
