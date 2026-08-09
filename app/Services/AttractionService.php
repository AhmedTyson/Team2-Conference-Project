<?php

namespace App\Services;

use App\Models\Attraction;
use App\Repositories\AttractionRepository;

class AttractionService
{
    protected $attractionRepository;

    public function __construct(AttractionRepository $attractionRepository)
    {
        $this->attractionRepository = $attractionRepository;
    }

    public function getAdminList()
    {
        return $this->attractionRepository->getForAdmin();
    }

    public function getPublicList()
    {
        return $this->attractionRepository->getForPublic();
    }

    public function showAdmin($id)
    {
        return $this->attractionRepository->findById($id);
    }

    public function showPublic($id)
    {
        return $this->attractionRepository->findById($id, ['destination', 'category']);
    }

    public function store(array $data)
    {
        return $this->attractionRepository->create($data);
    }

    public function update($id, array $data)
    {
        $attraction = $this->attractionRepository->findById($id);
        return $this->attractionRepository->update($attraction, $data);
    }

    public function destroy($id)
    {
        $attraction = $this->attractionRepository->findById($id);
        return $this->attractionRepository->delete($attraction);
    }
}
