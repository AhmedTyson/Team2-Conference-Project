<?php

namespace App\Repositories\Trips;

use App\Enums\ReviewStatus;
use App\Interfaces\Trips\ReviewRepositoryInterface;
use App\Models\Trips\Review;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class ReviewRepository implements ReviewRepositoryInterface
{
    public function getForAdmin(bool $trashed = false): Collection
    {
        return Review::with('user', 'reviewable')
            ->when($trashed, fn ($q) => $q->onlyTrashed())
            ->latest()
            ->get();
    }

    public function approvedForReviewable(Model $model): Collection
    {
        return Review::query()
            ->where('reviewable_type', $model->getMorphClass())
            ->where('reviewable_id', $model->getKey())
            ->where('status', ReviewStatus::APPROVED->value)
            ->with('user')
            ->latest()
            ->get();
    }

    public function countApproved(): int
    {
        return Review::where('status', ReviewStatus::APPROVED->value)->count();
    }

    public function findById($id): Review
    {
        return Review::findOrFail($id);
    }

    public function update(Review $review, array $data): Review
    {
        $review->update($data);

        return $review;
    }

    public function delete(Review $review): bool
    {
        $review->delete();

        return true;
    }
}
