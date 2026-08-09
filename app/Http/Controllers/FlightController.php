<?php

namespace App\Http\Controllers;

use App\Http\Resources\FlightResource;
use App\Services\FlightService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FlightController extends Controller
{
    protected $flightService;

    public function __construct(FlightService $flightService)
    {
        $this->flightService = $flightService;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $flights = $this->flightService->getPublicList();

        return FlightResource::collection($flights);
    }

    public function show(int $id): FlightResource
    {
        $flight = $this->flightService->show($id);

        return new FlightResource($flight);
    }
}
