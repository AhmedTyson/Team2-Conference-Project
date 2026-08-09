<?php

namespace App\Interfaces;

use App\Models\Review;
use Illuminate\Database\Eloquent\Collection;

interface ReviewRepositoryInterface
{
    public function getForAdmin(): Collection;

    public function findById($id): Review;

    public function update(Review $review, array $data): Review;

    public function delete(Review $review): bool;

}
