<?php

namespace App\Repositories\Trips;

use App\Interfaces\Trips\ReviewRepositoryInterface;
use App\Models\Trips\Review;
use Illuminate\Database\Eloquent\Collection;

class ReviewRepository implements ReviewRepositoryInterface
{
    public function getForAdmin(bool $trashed = false): Collection
    {
        return Review::with('user', 'reviewable')
            ->when($trashed, fn ($q) => $q->onlyTrashed())
            ->latest()
            ->get();
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
