<?php

namespace App\Interfaces\Trips;

use App\Models\Trips\Review;
use Illuminate\Database\Eloquent\Collection;

interface ReviewRepositoryInterface
{
    public function getForAdmin(bool $trashed = false): Collection;

    public function findById($id): Review;

    public function update(Review $review, array $data): Review;

    public function delete(Review $review): bool;

}
