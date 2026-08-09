<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttractionRequest;
use App\Http\Requests\UpdateAttractionRequest;
use App\Services\AttractionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminAttractionController extends Controller
{
    protected $attractionService;

    public function __construct(AttractionService $attractionService)
    {
        $this->attractionService = $attractionService;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['destination_id', 'category_id']);
        $perPage = min((int) $request->input('per_page', 15) ?: 15, 100);

        $attractions = $this->attractionService->getAdminList($filters, $perPage);

        return JsonResource::collection($attractions);
    }

    public function store(StoreAttractionRequest $request)
    {
        $attraction = $this->attractionService->store($request->validated());

        return new JsonResource($attraction);
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

        return response()->json(['success' => true]);
    }
}
