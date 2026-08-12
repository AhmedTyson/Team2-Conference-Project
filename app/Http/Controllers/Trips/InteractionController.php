<?php

namespace App\Http\Controllers\Trips;

use App\Http\Controllers\Controller;
use App\Enums\ReviewStatus;
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
        $class = Relation::getMorphedModel($type);

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
        if ($type === 'flight') {
            abort(400, 'Flights cannot be favourited.');
        }

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

        $review = $entity->reviews()->create([
            'user_id' => $request->user()->id,
            'rating' => $request->validated('rating'),
            'comment' => $request->validated('comment'),
            'status' => ReviewStatus::PENDING->value,
        ]);

        return ApiResponse::success(new ReviewResource($review), 'Review submitted successfully', 201);
    }

    /**
     * Delete an existing review.
     */
    public function destroyReview(Request $request, int $id): JsonResponse
    {
        $review = Review::findOrFail($id);

        if ($review->user_id !== $request->user()->id) {
            abort(403, 'You do not have permission to delete this review.');
        }

        $review->delete();

        return ApiResponse::success(null, 'Review deleted successfully');
    }
}
