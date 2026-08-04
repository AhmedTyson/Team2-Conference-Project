<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ReviewStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use Illuminate\Http\JsonResponse;

class AdminReviewController extends Controller
{
    /**
     * 1) GET /api/v1/admin/reviews
     * View all reviews (any status).
     */
    public function index(): JsonResponse
    {
        $reviews = Review::with('user', 'reviewable')->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => ReviewResource::collection($reviews),
        ]);
    }

    /**
     * 2) PATCH /api/v1/admin/reviews/{id}/approve
     * Approve a review (make it publicly visible).
     */
    public function approve(int $id): JsonResponse
    {
        $review = Review::findOrFail($id);

        $review->update([
            'status' => ReviewStatus::APPROVED->value,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review approved successfully.',
            'data'    => new ReviewResource($review),
        ]);
    }

    /**
     * 3) PATCH /api/v1/admin/reviews/{id}/reject
     * Reject a review (hide it from public view).
     */
    public function reject(int $id): JsonResponse
    {
        $review = Review::findOrFail($id);

        $review->update([
            'status' => ReviewStatus::REJECTED->value,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review rejected successfully.',
            'data'    => new ReviewResource($review),
        ]);
    }

    /**
     * 4) DELETE /api/v1/admin/reviews/{id}
     * Permanently delete a review.
     */
    public function destroy(int $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully.',
        ]);
    }
}
