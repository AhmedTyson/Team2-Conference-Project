<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreFlightRequest;
use App\Http\Requests\Catalog\UpdateFlightRequest;
use App\Models\Catalog\Flight;
use App\Services\Catalog\FlightService;
use App\Support\ApiResponse;
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
        $flights = $this->flightService->getAdminList(request('trashed') === '1');

        return ApiResponse::success($flights, 'Flights retrieved successfully');
    }

    public function store(StoreFlightRequest $request): JsonResponse
    {
        $flight = $this->flightService->store($request->validated());

        return ApiResponse::success($flight, 'Flight created successfully', 201);
    }

    public function update(UpdateFlightRequest $request, int $id): JsonResponse
    {
        $flight = $this->flightService->update($id, $request->validated());

        return ApiResponse::success($flight, 'Flight updated successfully');
    }

    public function destroy(int $id): JsonResponse
    {
        $this->flightService->destroy($id);

        return ApiResponse::success(null, 'Flight deleted successfully');
    }

    public function restore(int $id): JsonResponse
    {
        Flight::onlyTrashed()->findOrFail($id)->restore();

        return ApiResponse::success(null, 'Flight restored successfully');
    }
}
