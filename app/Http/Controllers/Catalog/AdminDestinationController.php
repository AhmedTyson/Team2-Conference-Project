<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreDestinationRequest;
use App\Http\Requests\Catalog\UpdateDestinationRequest;
use App\Http\Resources\DestinationResource;
use App\Models\Catalog\Country;
use App\Models\Catalog\Destination;
use App\Services\Catalog\Fixtures\OpenStreetService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class AdminDestinationController extends Controller
{
    protected OpenStreetService $mapService;

    public function __construct(OpenStreetService $mapService)
    {
        $this->mapService = $mapService;
    }

    public function index()
    {
        $destinations = Destination::with('country')->paginate(min((int) request('per_page', 15) ?: 15, 100));

        return DestinationResource::collection($destinations);
    }

    public function store(StoreDestinationRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (empty($validated['latitude']) || empty($validated['longitude'])) {
            $country = Country::find($validated['country_id']);
            $addressQuery = $validated['city_name'].', '.$country->name;
            $coords = $this->mapService->getCoordinates($addressQuery);
            if ($coords) {
                $validated['latitude'] = $coords['lat'];
                $validated['longitude'] = $coords['lng'];
            }
        }

        $destination = Destination::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Destination created successfully.',
            'data' => $destination->load('country'),
        ], 201);
    }

    public function update(UpdateDestinationRequest $request, int $id): JsonResponse
    {
        $destination = Destination::find($id);

        if (! $destination) {
            return ApiResponse::fail('Destination not found.', 'not_found', 404);
        }

        $validated = $request->validated();

        // If location fields changed but no coordinates were manually provided, try to re-resolve
        if (
            (isset($validated['city_name']) && $validated['city_name'] !== $destination->city_name) ||
            (isset($validated['country_id']) && $validated['country_id'] !== $destination->country_id)
        ) {
            if (empty($validated['latitude']) || empty($validated['longitude'])) {
                $countryId = $validated['country_id'] ?? $destination->country_id;
                $cityName = $validated['city_name'] ?? $destination->city_name;
                $country = Country::find($countryId);

                if ($country) {
                    $addressQuery = $cityName.', '.$country->name;
                    $coords = $this->mapService->getCoordinates($addressQuery);
                    if ($coords) {
                        $validated['latitude'] = $coords['lat'];
                        $validated['longitude'] = $coords['lng'];
                    }
                }
            }
        }

        $destination->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Destination updated successfully.',
            'data' => $destination->load('country'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $destination = Destination::find($id);

        if (! $destination) {
            return ApiResponse::fail('Destination not found.', 'not_found', 404);
        }

        $destination->delete();

        return response()->json([
            'success' => true,
            'message' => 'Destination deleted successfully.',
        ]);
    }
}

