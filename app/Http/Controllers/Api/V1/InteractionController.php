<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ReviewStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Models\Review;
use Illuminate\Database\Eloquent\Relations\Relation;
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
    public function toggleFavourite(Request $request, string $type, $id)
    {
        $class = $this->resolveModelClass($type);
        $entity = $class::findOrFail($id);

        $favourite = $entity->favourites()->where('user_id', $request->user()->id)->first();

        if ($favourite) {
            $favourite->delete();
            return response()->json([
                'message' => 'Removed from favourites',
                'status'  => 'removed'
            ]);
        }

        $entity->favourites()->create([
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Added to favourites',
            'status'  => 'added'
        ], 201);
    }

    /**
     * Store a new review for a given entity.
     */
    public function storeReview(StoreReviewRequest $request, string $type, $id)
    {
        $class = $this->resolveModelClass($type);
        $entity = $class::findOrFail($id);

        $review = $entity->reviews()->create([
            'user_id' => $request->user()->id,
            'rating'  => $request->validated('rating'),
            'comment' => $request->validated('comment'),
            'status'  => ReviewStatus::PENDING->value,
        ]);

        return response()->json([
            'message' => 'Review submitted successfully',
            'data'    => $review
        ], 201);
    }

    /**
     * Delete an existing review.
     */
    public function destroyReview(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        if ($review->user_id !== $request->user()->id) {
            abort(403, 'You do not have permission to delete this review.');
        }

        $review->delete();

        return response()->json([
            'message' => 'Review deleted successfully'
        ]);
    }
}
