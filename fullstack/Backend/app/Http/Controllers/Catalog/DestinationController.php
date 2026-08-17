<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\BookTourRequest;
use App\Http\Requests\Catalog\ListDestinationsRequest;
use App\Http\Resources\DestinationCardResource;
use App\Http\Resources\DestinationDetailResource;
use App\Models\Catalog\Destination;
use App\Services\Catalog\DestinationService;
use App\Services\Commerce\CheckoutService;
use App\Support\ApiResponse;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\AbstractPaginator;

class DestinationController extends Controller
{
    protected $destinationService;

    protected $checkoutService;

    public function __construct(DestinationService $destinationService, CheckoutService $checkoutService)
    {
        $this->destinationService = $destinationService;
        $this->checkoutService = $checkoutService;
    }

    public function index(ListDestinationsRequest $request): JsonResponse
    {
        $destinations = $this->destinationService->index($request->validated());
        if ($destinations instanceof AbstractPaginator) {
            return response()->json(DestinationCardResource::collection($destinations)->response()->getData(true));
        }

        return ApiResponse::success(
            DestinationCardResource::collection($destinations),
            'Destinations fetched successfully'
        );
    }

    public function show($id): JsonResponse
    {
        return ApiResponse::success(
            new DestinationDetailResource($this->destinationService->detail($id)),
            'Destination fetched successfully'
        );
    }

    public function book(Destination $destination, BookTourRequest $request): JsonResponse
    {
        try {
            $trip = $this->destinationService->bookableTripFor($destination);

            $data = $this->checkoutService->processCheckout(
                $request->user(),
                'trip_package',
                $trip->id,
                [],
            );

            return ApiResponse::success($data, 'Booking initiated successfully', 201);

        } catch (AuthorizationException $e) {
            return ApiResponse::fail($e->getMessage(), 'forbidden', 403);
        } catch (Exception $e) {
            return ApiResponse::fail($e->getMessage(), 'booking_failed', 422);
        }
    }
}
