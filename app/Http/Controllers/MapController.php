<?php

namespace App\Http\Controllers;

use App\Services\Fixtures\OpenStreetService;
use App\Models\Destination;
use App\Models\Trip;

class MapController extends Controller
{
    public function destination(Destination $destination, OpenStreetService $maps)
    {
        // لو مفيش lat/lng متخزنة، هات واحفظها
        if (!$destination->latitude || !$destination->longitude) {
            $coords = $maps->getCoordinates($destination->address);

            if ($coords) {
                $destination->update([
                    'latitude' => $coords['lat'],
                    'longitude' => $coords['lng'],
                ]);
            }
        }

        return response()->json([
            'destination' => $destination,
            'attractions' => $maps->getNearbyPlaces($destination->latitude, $destination->longitude, 'tourist_attraction'),
            'hotels' => $maps->getNearbyPlaces($destination->latitude, $destination->longitude, 'lodging'),
            'restaurants' => $maps->getNearbyPlaces($destination->latitude, $destination->longitude, 'restaurant'),
        ]);
    }

    public function trip(Trip $trip,OpenStreetService $osm){

        $this->authorize('view',$trip);

        $points = $trip->itineraryPoints()->orderBy()->get(['latitude,longitude']);

        if($points->count()<2){
            return response()->json([
                "success"=>false,
                "message"=>"you must enter 2 points"
            ]);
        }

        
    }
}