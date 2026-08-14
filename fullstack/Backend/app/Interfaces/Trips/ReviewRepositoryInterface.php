<?php

namespace App\Interfaces\Trips;

use App\Models\Trips\Review;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

interface ReviewRepositoryInterface
{
    public function getForAdmin(bool $trashed = false): Collection;

    public function approvedForReviewable(Model $model): Collection;

    public function countApproved(): int;

    public function findById($id): Review;

    public function update(Review $review, array $data): Review;

    public function delete(Review $review): bool;
}
