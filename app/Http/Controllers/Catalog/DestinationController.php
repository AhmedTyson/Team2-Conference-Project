<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\DestinationResource;
use App\Services\Catalog\DestinationService;
use App\Support\ApiResponse;

class DestinationController extends Controller
{
    protected $destinationService;

    public function __construct(DestinationService $destinationService)
    {
        $this->destinationService = $destinationService;
    }

    public function index(): JsonResponse
    {
        return ApiResponse::success(DestinationResource::collection($this->destinationService->index()), 'Destinations fetched successfully');
    }

    public function show($id): JsonResponse
    {
        return ApiResponse::success(new DestinationResource($this->destinationService->show($id)), 'Destination fetched successfully');
    }
}
