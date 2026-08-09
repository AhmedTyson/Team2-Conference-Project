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

    public function index()
    {
        $attractions = $this->attractionService->getAdminList();
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
