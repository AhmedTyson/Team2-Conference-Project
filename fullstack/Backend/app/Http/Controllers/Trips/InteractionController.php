<?php

namespace App\Http\Controllers\Trips;

use App\Enums\ReviewStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Trips\StoreReviewRequest;
use App\Http\Resources\FavouriteResource;
use App\Http\Resources\ReviewResource;
use App\Models\Trips\Review;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InteractionController extends Controller
{
    /**
     * Resolve the morphed model class from the type string.
     */
    protected function resolveModelClass(string $type): string
    {
        $map = [
            'hotel' => \App\Models\Catalog\Hotel::class,
            'hotels' => \App\Models\Catalog\Hotel::class,
            'restaurant' => \App\Models\Catalog\Restaurant::class,
            'restaurants' => \App\Models\Catalog\Restaurant::class,
            'attraction' => \App\Models\Catalog\Attraction::class,
            'attractions' => \App\Models\Catalog\Attraction::class,
            'destination' => \App\Models\Catalog\Destination::class,
            'destinations' => \App\Models\Catalog\Destination::class,
            'flight' => \App\Models\Catalog\Flight::class,
            'flights' => \App\Models\Catalog\Flight::class,
        ];

        $class = $map[strtolower($type)] ?? Relation::getMorphedModel($type);

        if (! $class) {
            abort(404, "Type '{$type}' is not supported.");
        }

        return $class;
    }

    /**
     * Toggle a favorite for a given entity.
     */
    public function toggleFavourite(Request $request, string $type, int $id): JsonResponse
    {
        $class = $this->resolveModelClass($type);
        $entity = $class::findOrFail($id);

        $favourite = $entity->favourites()->where('user_id', $request->user()->id)->first();

        if ($favourite) {
            $favourite->delete();

            return ApiResponse::success(['status' => 'removed'], 'Removed from favourites');
        }

        $favourite = $entity->favourites()->create([
            'user_id' => $request->user()->id,
        ]);

        return ApiResponse::success(['data' => new FavouriteResource($favourite), 'status' => 'added'], 'Added to favourites', 201);
    }

    /**
     * Store a new review for a given entity.
     */
    public function storeReview(StoreReviewRequest $request, string $type, int $id): JsonResponse
    {
        $class = $this->resolveModelClass($type);
        $entity = $class::findOrFail($id);

        $userId = $request->user()->id;
        $existingReview = $entity->reviews()->where('user_id', $userId)->first();

        if ($existingReview) {
            $existingReview->update([
                'rating' => $request->validated('rating'),
                'comment' => $request->validated('comment'),
                'status' => ReviewStatus::PENDING->value,
            ]);

            return ApiResponse::success(new ReviewResource($existingReview), 'Review updated successfully and is pending admin approval', 200);
        }

        $review = $entity->reviews()->create([
            'user_id' => $userId,
            'rating' => $request->validated('rating'),
            'comment' => $request->validated('comment'),
            'status' => ReviewStatus::PENDING->value,
        ]);

        return ApiResponse::success(new ReviewResource($review), 'Review submitted successfully and is pending admin approval', 201);
    }

    /**
     * Get all reviews created by the authenticated user.
     */
    public function myReviews(Request $request): JsonResponse
    {
        $reviews = Review::with('reviewable')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return ApiResponse::success(ReviewResource::collection($reviews), 'User reviews retrieved successfully');
    }

    /**
     * Delete an existing review.
     */
    public function destroyReview(Request $request, int $id): JsonResponse
    {
        $review = Review::findOrFail($id);

        if ($review->user_id !== $request->user()->id && ! $request->user()->hasAnyRole(['admin', 'super_admin'])) {
            abort(403, 'You do not have permission to delete this review.');
        }

        $review->delete();

        return ApiResponse::success(null, 'Review deleted successfully');
    }

    /**
     * Get dynamic reviews summary and user review feed for a specific entity type and ID.
     */
    public function getEntityReviews(Request $request, string $type, int $id): JsonResponse
    {
        $class = $this->resolveModelClass($type);
        $entity = $class::findOrFail($id);

        $currentUser = auth('api')->user() ?? $request->user();

        // Approved reviews visible publicly
        $approvedReviews = $entity->reviews()
            ->with('user')
            ->where('status', ReviewStatus::APPROVED->value)
            ->latest()
            ->get();

        // Check if current user has an existing review (either pending or approved)
        $userReviewModel = $currentUser
            ? $entity->reviews()->where('user_id', $currentUser->id)->first()
            : null;

        // Pending reviews owned by the current authenticated user
        $myPendingReviews = ($currentUser && $userReviewModel && ($userReviewModel->status instanceof ReviewStatus ? $userReviewModel->status->value : (string) $userReviewModel->status) === ReviewStatus::PENDING->value)
            ? collect([$userReviewModel->load('user')])
            : collect();

        $totalApproved = $approvedReviews->count();
        $baseRating = (float) ($entity->rating ?? 0);

        if ($totalApproved > 0) {
            $avgRating = round($approvedReviews->avg('rating'), 1);
            $c5 = $approvedReviews->where('rating', 5)->count();
            $c4 = $approvedReviews->where('rating', 4)->count();
            $c3 = $approvedReviews->where('rating', 3)->count();
            $c2 = $approvedReviews->where('rating', 2)->count();
            $c1 = $approvedReviews->where('rating', 1)->count();
        } else {
            $avgRating = $baseRating;
            $c5 = 0; $c4 = 0; $c3 = 0; $c2 = 0; $c1 = 0;
        }

        $calcPerc = function ($count) use ($totalApproved) {
            return $totalApproved > 0 ? (int) round(($count / $totalApproved) * 100) : 0;
        };

        $summary = [
            'rating' => $avgRating,
            'total_reviews' => $totalApproved,
            'distribution' => [
                '5' => ['count' => $c5, 'percentage' => $calcPerc($c5)],
                '4' => ['count' => $c4, 'percentage' => $calcPerc($c4)],
                '3' => ['count' => $c3, 'percentage' => $calcPerc($c3)],
                '2' => ['count' => $c2, 'percentage' => $calcPerc($c2)],
                '1' => ['count' => $c1, 'percentage' => $calcPerc($c1)],
            ],
            'sub_scores' => [
                'cleanliness' => $avgRating > 0 ? min(5.0, round($avgRating * 0.98, 1)) : 0,
                'safety' => $avgRating > 0 ? min(5.0, round($avgRating * 1.01, 1)) : 0,
                'staff' => $avgRating > 0 ? min(5.0, round($avgRating * 1.0, 1)) : 0,
                'amenities' => $avgRating > 0 ? min(5.0, round($avgRating * 0.95, 1)) : 0,
                'location' => $avgRating > 0 ? min(5.0, round($avgRating * 0.97, 1)) : 0,
            ],
        ];

        // Combined feed: Filter approved reviews so user doesn't see duplicate if approved, plus pending if pending
        $feedReviews = $myPendingReviews->concat(
            $approvedReviews->filter(function ($rev) use ($currentUser) {
                return !$currentUser || $rev->user_id !== $currentUser->id;
            })
        );

        // If user's review is approved, include it at top of feed for them
        if ($currentUser && $userReviewModel && ($userReviewModel->status instanceof ReviewStatus ? $userReviewModel->status->value : (string) $userReviewModel->status) === ReviewStatus::APPROVED->value) {
            $feedReviews = collect([$userReviewModel->load('user')])->concat(
                $approvedReviews->filter(function ($rev) use ($currentUser) {
                    return $rev->user_id !== $currentUser->id;
                })
            );
        }

        $formattedReviews = $feedReviews->map(function ($rev) {
            $u = $rev->user;
            $statusVal = $rev->status instanceof ReviewStatus ? $rev->status->value : (string) $rev->status;
            return [
                'id' => $rev->id,
                'user_id' => $rev->user_id,
                'user_name' => $u ? $u->name : 'Verified Traveler',
                'user_avatar' => ($u && $u->profile_image)
                    ? (str_starts_with($u->profile_image, 'http') ? $u->profile_image : url($u->profile_image))
                    : 'https://ui-avatars.com/api/?name=' . urlencode($u ? $u->name : 'User') . '&background=262626&color=fbbf24&bold=true',
                'rating' => (float) $rev->rating,
                'comment' => $rev->comment,
                'status' => $statusVal,
                'is_pending' => $statusVal === ReviewStatus::PENDING->value,
                'created_at' => $rev->created_at ? $rev->created_at->toIso8601String() : null,
                'time_ago' => $rev->created_at ? $rev->created_at->diffForHumans() : 'Recently',
            ];
        });

        $userReviewData = $userReviewModel ? [
            'id' => $userReviewModel->id,
            'rating' => (int) $userReviewModel->rating,
            'comment' => $userReviewModel->comment,
            'status' => $userReviewModel->status instanceof ReviewStatus ? $userReviewModel->status->value : (string) $userReviewModel->status,
            'is_pending' => ($userReviewModel->status instanceof ReviewStatus ? $userReviewModel->status->value : (string) $userReviewModel->status) === ReviewStatus::PENDING->value,
        ] : null;

        return ApiResponse::success([
            'summary' => $summary,
            'reviews' => $formattedReviews,
            'user_review' => $userReviewData,
        ], 'Reviews retrieved successfully');
    }
}
