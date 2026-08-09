<?php

namespace App\Services;

use App\Enums\ReviewStatus;
use App\Interfaces\ReviewRepositoryInterface;
use App\Repositories\ReviewRepository;

class ReviewService
{
    protected $reviewRepository;

    public function __construct(ReviewRepositoryInterface $reviewRepository)
    {
        $this->reviewRepository = $reviewRepository;
    }

    public function getAdminList()
    {
        return $this->reviewRepository->getForAdmin();
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
