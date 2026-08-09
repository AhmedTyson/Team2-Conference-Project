<?php

namespace App\Services;

use App\Interfaces\HotelRepositoryInterface;
use App\Repositories\HotelRepository;

class HotelService
{
    protected $hotelRepository;

    public function __construct(HotelRepositoryInterface $hotelRepository)
    {
        $this->hotelRepository = $hotelRepository;
    }

    public function index()
    {
        return $this->hotelRepository->getAll();
    }

    public function show($id)
    {
        return $this->hotelRepository->getById($id);
    }

    public function store(array $data)
    {
        return $this->hotelRepository->create($data);
    }

    public function update($id, array $data)
    {
        return $this->hotelRepository->update($id, $data);
    }

    public function destroy($id)
    {
        return $this->hotelRepository->delete($id);
    }
}
