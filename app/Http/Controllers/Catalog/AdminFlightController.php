<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreFlightRequest;
use App\Http\Requests\Catalog\UpdateFlightRequest;
use App\Services\Catalog\FlightService;
use Illuminate\Http\JsonResponse;

class AdminFlightController extends Controller
{
    protected $flightService;

    public function __construct(FlightService $flightService)
    {
        $this->flightService = $flightService;
    }

    public function index(): JsonResponse
    {
        $flights = $this->flightService->getAdminList();

        return response()->json([
            'success' => true,
            'data' => $flights,
        ]);
    }

    public function store(StoreFlightRequest $request): JsonResponse
    {
        $flight = $this->flightService->store($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Flight created successfully.',
            'data' => $flight,
        ], 201);
    }

    public function update(UpdateFlightRequest $request, int $id): JsonResponse
    {
        $flight = $this->flightService->update($id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Flight updated successfully.',
            'data' => $flight,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->flightService->destroy($id);

        return response()->json([
            'success' => true,
            'message' => 'Flight deleted successfully.',
        ]);
    }
}
