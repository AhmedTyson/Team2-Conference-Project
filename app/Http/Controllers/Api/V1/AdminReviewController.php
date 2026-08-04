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
}