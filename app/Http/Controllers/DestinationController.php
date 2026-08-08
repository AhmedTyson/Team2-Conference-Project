<?php

namespace App\Http\Controllers;

use App\Http\Resources\DestinationResource;
use App\Services\DestinationService;

class DestinationController extends Controller
{
    protected $destinationService;

    public function __construct(DestinationService $destinationService)
    {
        $this->destinationService = $destinationService;
    }

    public function index()
    {
        return response()->json([
            'success' => true,
            'message' => 'Destinations fetched successfully',
            'data' => DestinationResource::collection($this->destinationService->index()),
        ]);
    }

    public function show($id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Destination fetched successfully',
            'data' => new DestinationResource($this->destinationService->show($id)),
        ]);
    }
}
