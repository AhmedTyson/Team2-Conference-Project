<?php

namespace App\Http\Controllers;

use App\Http\Resources\DestinationResource;
use App\Models\Destination;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DestinationController extends Controller
{
    public function index()
    {

        $destinations = Cache::remember('destinations',now()->addHours(1),function()
        {
            return Destination::with('country')->get();
        });

        return response()->json([
            "success"=>true,
            "message"=>"Destinations fetched successfully",
            "data"=>DestinationResource::collection($destinations)
        ]);

    }

    public function show($id)
    {
        $destination = Destination::with('country')->findOrFail($id);

        return new DestinationResource($destination);
    }
}
