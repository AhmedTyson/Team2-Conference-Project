<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Interfaces\RestaurantRepositoryInterface;
use App\Repositories\RestaurantRepository;

class RestaurantService
{
    protected $restaurantRepository;

    public function __construct(RestaurantRepositoryInterface $restaurantRepository)
    {
        $this->restaurantRepository = $restaurantRepository;
    }

    public function getAdminList()
    {
        return $this->restaurantRepository->getForAdmin();
    }

    public function getPublicList()
    {
        return $this->restaurantRepository->getForPublic();
    }

    public function showAdmin($id)
    {
        return $this->restaurantRepository->findById($id);
    }

    public function showPublic($id)
    {
        return $this->restaurantRepository->findById($id, ['destination', 'category']);
    }

    public function store(array $data)
    {
        return $this->restaurantRepository->create($data);
    }

    public function update($id, array $data)
    {
        $restaurant = $this->restaurantRepository->findById($id);
        return $this->restaurantRepository->update($restaurant, $data);
    }

    public function destroy($id)
    {
        $restaurant = $this->restaurantRepository->findById($id);
        return $this->restaurantRepository->delete($restaurant);
    }
}
