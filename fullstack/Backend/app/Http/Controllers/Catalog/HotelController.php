<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\HotelResource;
use App\Http\Resources\ReviewResource;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Hotel;
use App\Services\Catalog\HotelService;
use App\Services\Trips\ReviewService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class HotelController extends Controller
{
    protected $hotelService;

    protected $reviewService;

    public function __construct(HotelService $hotelService, ReviewService $reviewService)
    {
        $this->hotelService = $hotelService;
        $this->reviewService = $reviewService;
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

    // Hotels belonging to a destination
    public function byDestination(Destination $destination): JsonResponse
    {
        return ApiResponse::success(
            HotelResource::collection($this->hotelService->byDestination($destination->id)),
            'Hotels fetched successfully'
        );
    }

    // Approved reviews for a hotel
    public function reviews(Hotel $hotel): JsonResponse
    {
        return ApiResponse::success(
            ReviewResource::collection($this->reviewService->getApprovedForReviewable($hotel)),
            'Reviews fetched successfully'
        );
    }
}
