<?php

namespace App\Repositories;

use App\Interfaces\ReviewRepositoryInterface;
use App\Models\Review;
use Illuminate\Database\Eloquent\Collection;

class ReviewRepository implements ReviewRepositoryInterface
{
    public function getForAdmin(): Collection
    {
        return Review::with('user', 'reviewable')->latest()->get();
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
