<?php

namespace App\Http\Controllers;

use App\Http\Resources\DestinationResource;
use App\Models\Destination;
use Illuminate\Http\Request;

class DestinationController extends Controller
{
    public function index()
    {
    $destinations = Destination::with('country')->get();
    return DestinationResource::collection($destinations);
    }

    public function show($id)
    {
        $destination = Destination::with('country')->findOrFail($id);

        return new DestinationResource($destination);
    }
}
