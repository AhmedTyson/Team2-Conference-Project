<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreAttractionRequest;
use App\Http\Requests\Catalog\UpdateAttractionRequest;
use App\Models\Catalog\Attraction;
use App\Services\Catalog\AttractionService;
use App\Support\ApiResponse;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminAttractionController extends Controller
{
    protected $attractionService;

    public function __construct(AttractionService $attractionService)
    {
        $this->attractionService = $attractionService;
    }

    public function index()
    {
        $attractions = $this->attractionService->getAdminList(request('trashed') === '1');

        return JsonResource::collection($attractions);
    }

    public function store(StoreAttractionRequest $request)
    {
        $attraction = $this->attractionService->store($request->validated());

        return (new JsonResource($attraction))->response()->setStatusCode(201);
    }

    public function show($id)
    {
        $attraction = $this->attractionService->showAdmin($id);

        return new JsonResource($attraction);
    }

    public function update(UpdateAttractionRequest $request, $id)
    {
        $attraction = $this->attractionService->update($id, $request->validated());

        return new JsonResource($attraction);
    }

    public function destroy($id)
    {
        $this->attractionService->destroy($id);

        return ApiResponse::success(null, 'Attraction deleted successfully');
    }

    public function restore($id)
    {
        Attraction::onlyTrashed()->findOrFail($id)->restore();

        return ApiResponse::success(null, 'Attraction restored successfully');
    }
}
