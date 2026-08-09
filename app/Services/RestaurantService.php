<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Repositories\RestaurantRepository;

class RestaurantService
{
    protected $restaurantRepository;

    public function __construct(RestaurantRepository $restaurantRepository)
    {
        $this->restaurantRepository = $restaurantRepository;
    }

    public function getAdminList(int $perPage)
    {
        return $this->restaurantRepository->getForAdmin($perPage);
    }

    public function getPublicList(int $perPage = 10)
    {
        return $this->restaurantRepository->getForPublic($perPage);
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
