<?php

namespace App\Http\Controllers;

use App\Http\Resources\HotelResource;
use App\Models\Hotel;
use Illuminate\Http\Request;

class HotelController extends Controller
{
    public function index()
    {
    $hotels = Hotel::with('destination')->get();
    return HotelResource::collection($hotels);
    }

    public function show($id)
    {
    $hotel = Hotel::with('destination')->findOrFail($id);
    return new HotelResource($hotel);
    }
}
