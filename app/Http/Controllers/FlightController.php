<?php

namespace App\Http\Controllers;

use App\Http\Resources\FlightResource;
use App\Models\Flight;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FlightController extends Controller
{
    // Display a listing of flights.

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Flight::query();

        // Optional filtering by departure and arrival airports
        if ($request->has('departure_airport')) {
            $query->where('departure_airport', $request->query('departure_airport'));
        }

        if ($request->has('arrival_airport')) {
            $query->where('arrival_airport', $request->query('arrival_airport'));
        }

        $flights = $query->paginate(10);

        return FlightResource::collection($flights);
    }

    // Display the specified flight.

    public function show(int $id): FlightResource
    {
        $flight = Flight::findOrFail($id);

        return new FlightResource($flight);
    }
}
