<?php

namespace App\Http\Controllers\Trips;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Trips\Review;
use App\Services\Trips\ReviewService;
use Illuminate\Http\JsonResponse;

class AdminReviewController extends Controller
{
    protected $reviewService;

    public function __construct(ReviewService $reviewService)
    {
        $this->reviewService = $reviewService;
    }

    public function index()
    {
        $reviews = $this->reviewService->getAdminList(request('trashed') === '1');
        return ReviewResource::collection($reviews);
    }

    public function approve(int $id): JsonResponse
    {
        $review = $this->reviewService->approve($id);
        return response()->json([
            'success' => true,
            'message' => 'Review approved successfully.',
            'data' => new ReviewResource($review),
        ]);
    }

    public function reject(int $id): JsonResponse
    {
        $review = $this->reviewService->reject($id);
        return response()->json([
            'success' => true,
            'message' => 'Review rejected successfully.',
            'data' => new ReviewResource($review),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->reviewService->destroy($id);
        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully.',
        ]);
    }

    public function restore(int $id): JsonResponse
    {
        Review::onlyTrashed()->findOrFail($id)->restore();

        return response()->json([
            'success' => true,
            'message' => 'Review restored successfully.',
        ]);
    }
}
