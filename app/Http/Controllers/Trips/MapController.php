<?php

namespace App\Http\Controllers\Trips;

use App\Http\Controllers\Controller;
use App\Jobs\GeocodeDestinationJob;
use App\Models\Catalog\Attraction;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Hotel;
use App\Models\Trips\Trip;
use App\Services\Catalog\Fixtures\OpenStreetService;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class MapController extends Controller
{
    use AuthorizesRequests;

    public function destination(Destination $destination, OpenStreetService $maps)
    {
        $missingCoordinates = ! $destination->latitude || ! $destination->longitude;

        // GET stays pure: geocoding backfill moves to a background job.
        if ($missingCoordinates) {
            GeocodeDestinationJob::dispatch($destination);
        }

        $attractions = $maps->getAttractionsWithAI(
            $destination->city_name
        );

        $restaurants = $missingCoordinates
            ? []
            : $maps->getNearbyPlaces(
                $destination->latitude,
                $destination->longitude,
                'restaurant',
                1000
            );

        $hotels = $missingCoordinates
            ? []
            : $maps->getNearbyPlaces(
                $destination->latitude,
                $destination->longitude,
                'lodging',
                1000
            );

        return ApiResponse::success([
            'destination' => $destination,
            'attractions' => $attractions,
            'hotels' => $hotels,
            'restaurants' => $restaurants,
        ], 'Destination map data retrieved successfully');
    }

    public function trip(Request $request, Trip $trip, OpenStreetService $osm)
    {
        // SEC-02: ownership gate mirrors TripController::show — 404, no existence leak.
        if (Gate::forUser($request->user())->denies('view', $trip)) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        $items = $trip->itineraryItems()
            ->with('itemable')
            ->orderBy('day_number')
            ->orderBy('item_order')
            ->get();

        $points = $items
            ->map(function ($item) {

                if (! $item->itemable) {
                    return null;
                }

                // Attraction أو Restaurant أو أي موديل عنده الإحداثيات
                if (
                    isset($item->itemable->latitude) &&
                    isset($item->itemable->longitude)
                ) {
                    return [
                        'lat' => $item->itemable->latitude,
                        'lng' => $item->itemable->longitude,
                    ];
                }

                // Hotel => خد الإحداثيات من الـ Destination
                if (
                    $item->itemable instanceof Hotel &&
                    $item->itemable->destination
                ) {
                    return [
                        'lat' => $item->itemable->destination->latitude,
                        'lng' => $item->itemable->destination->longitude,
                    ];
                }

                return null;
            })
            ->filter()
            ->values();

        if ($points->count() < 2) {
            return ApiResponse::fail(
                'Trip must contain at least two locations.',
                'not_enough_points',
                422
            );
        }

        $origin = $points->first();
        $destination = $points->last();
        $waypoints = $points->slice(1, -1)->values()->toArray();

        $directions = $osm->getDirections(
            $origin,
            $destination,
            $waypoints
        );

        return ApiResponse::success(['directions' => $directions], 'Trip directions retrieved successfully');
    }
}
