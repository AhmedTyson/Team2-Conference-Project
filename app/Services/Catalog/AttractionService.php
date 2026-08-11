<?php

namespace App\Services\Catalog;

use App\Models\Catalog\Attraction;
use App\Interfaces\Catalog\AttractionRepositoryInterface;
use App\Repositories\Catalog\AttractionRepository;

class AttractionService
{
    protected $attractionRepository;

    public function __construct(AttractionRepositoryInterface $attractionRepository)
    {
        $this->attractionRepository = $attractionRepository;
    }

    public function getAdminList(bool $trashed = false)
    {
        return $this->attractionRepository->getForAdmin($trashed);
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
