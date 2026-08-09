<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;

class AdminReviewController extends Controller
{
    protected $reviewService;

    public function __construct(ReviewService $reviewService)
    {
        $this->reviewService = $reviewService;
    }

    /**
     * 1) GET /api/v1/admin/reviews
     * View all reviews (any status).
     */
    public function index()
    {
        $perPage = min((int) request('per_page', 15) ?: 15, 100);
        $reviews = $this->reviewService->getAdminList($perPage);

        return ReviewResource::collection($reviews);
    }

    /**
     * 2) PATCH /api/v1/admin/reviews/{id}/approve
     * Approve a review (make it publicly visible).
     */
    public function approve(int $id): JsonResponse
    {
        $review = $this->reviewService->approve($id);

        return response()->json([
            'success' => true,
            'message' => 'Review approved successfully.',
            'data' => new ReviewResource($review),
        ]);
    }

    /**
     * 3) PATCH /api/v1/admin/reviews/{id}/reject
     * Reject a review (hide it from public view).
     */
    public function reject(int $id): JsonResponse
    {
        $review = $this->reviewService->reject($id);

        return response()->json([
            'success' => true,
            'message' => 'Review rejected successfully.',
            'data' => new ReviewResource($review),
        ]);
    }

    /**
     * 4) DELETE /api/v1/admin/reviews/{id}
     * Permanently delete a review.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->reviewService->destroy($id);

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully.',
        ]);
    }
}
