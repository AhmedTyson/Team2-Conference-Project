<?php

namespace App\Http\Controllers;

use App\Models\Attraction;
use App\Models\Destination;
use App\Models\Hotel;
use App\Models\Trip;
use App\Services\Fixtures\OpenStreetService;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Log;

class MapController extends Controller
{
    use AuthorizesRequests;

    public function destination(Destination $destination, OpenStreetService $maps)
    {
        set_time_limit(90);

        if (! $destination->latitude || ! $destination->longitude) {

            $query = "{$destination->name}, {$destination->city_name}";
            $coords = $maps->getCoordinates($query);

            if ($coords) {
                $destination->update([
                    'latitude' => $coords['lat'],
                    'longitude' => $coords['lng'],
                ]);

                $destination->refresh();
            }
        }

        $attractions = $maps->getAttractionsWithAI(
            $destination->city_name
        );

        $restaurants = $maps->getNearbyPlaces(
            $destination->latitude,
            $destination->longitude,
            'restaurant',
            1000
        );

        $hotels = $maps->getNearbyPlaces(
            $destination->latitude,
            $destination->longitude,
            'lodging',
            1000
        );

        return response()->json([
            'success' => true,
            'message' => 'Destination map data retrieved successfully',
            'destination' => $destination,
            'attractions' => $attractions,
            'hotels' => $hotels,
            'restaurants' => $restaurants,
        ]);
    }

    public function trip(Trip $trip, OpenStreetService $osm)
    {
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

        Log::info($points->toArray());

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

        return response()->json([
            'success' => true,
            'directions' => $directions,
        ]);
    }
}
