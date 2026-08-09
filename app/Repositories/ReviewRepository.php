<?php

namespace App\Repositories;

use App\Models\Review;
use Illuminate\Pagination\LengthAwarePaginator;

class ReviewRepository
{
    public function getForAdmin(int $perPage): LengthAwarePaginator
    {
        return Review::with('user', 'reviewable')->latest()->paginate($perPage);
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
