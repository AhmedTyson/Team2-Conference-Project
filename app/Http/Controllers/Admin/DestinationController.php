<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDestinationRequest;
use App\Http\Requests\Admin\UpdateDestinationRequest;
use App\Models\Destination;
use App\Models\Country;
use App\Services\Fixtures\OpenStreetService;
use Illuminate\Http\JsonResponse;

class DestinationController extends Controller
{
    protected OpenStreetService $mapService;

    public function __construct(OpenStreetService $mapService)
    {
        $this->mapService = $mapService;
    }

    public function index()
    {
        $destinations = Destination::with('country')->paginate(min((int) request("per_page", 15) ?: 15, 100));
        return \App\Http\Resources\DestinationResource::collection($destinations);
    }

    public function store(StoreDestinationRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (empty($validated['latitude']) || empty($validated['longitude'])) {
            $country = Country::find($validated['country_id']);
            $addressQuery = $validated['city_name'] . ', ' . $country->name;
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
            'data' => $destination->load('country')
        ], 201);
    }

    public function update(UpdateDestinationRequest $request, int $id): JsonResponse
    {
        $destination = Destination::find($id);

        if (!$destination) {
            return response()->json([
                'success' => false,
                'message' => 'Destination not found.'
            ], 404);
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
                    $addressQuery = $cityName . ', ' . $country->name;
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
            'data' => $destination->load('country')
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $destination = Destination::find($id);

        if (!$destination) {
            return response()->json([
                'success' => false,
                'message' => 'Destination not found.'
            ], 404);
        }

        $destination->delete();

        return response()->json([
            'success' => true,
            'message' => 'Destination deleted successfully.'
        ]);
    }
}
