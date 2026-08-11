<?php

namespace App\Services\Trips;

use App\Enums\ReviewStatus;
use App\Interfaces\Trips\ReviewRepositoryInterface;
use App\Repositories\Trips\ReviewRepository;

class ReviewService
{
    protected $reviewRepository;

    public function __construct(ReviewRepositoryInterface $reviewRepository)
    {
        $this->reviewRepository = $reviewRepository;
    }

    public function getAdminList(bool $trashed = false)
    {
        return $this->reviewRepository->getForAdmin($trashed);
    }

    public function approve($id)
    {
        $review = $this->reviewRepository->findById($id);
        return $this->reviewRepository->update($review, [
            'status' => ReviewStatus::APPROVED->value,
        ]);
    }

    public function reject($id)
    {
        $review = $this->reviewRepository->findById($id);
        return $this->reviewRepository->update($review, [
            'status' => ReviewStatus::REJECTED->value,
        ]);
    }

    public function destroy($id)
    {
        $review = $this->reviewRepository->findById($id);
        return $this->reviewRepository->delete($review);
    }
}
