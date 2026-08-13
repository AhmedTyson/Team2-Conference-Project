<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\HotelResource;
use App\Models\Catalog\Hotel;
use App\Services\Catalog\HotelService;

class HotelController extends Controller
{
    protected $hotelService;

    public function __construct(HotelService $hotelService)
    {
        $this->hotelService = $hotelService;
    }

    // List all hotels
    public function index()
    {
        return HotelResource::collection($this->hotelService->index());
    }

    // Show a single hotel
    public function show($id)
    {
        return new HotelResource($this->hotelService->show($id));
    }
}
