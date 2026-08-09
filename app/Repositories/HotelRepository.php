<?php

namespace App\Repositories;

use App\Interfaces\HotelRepositoryInterface;
use App\Models\Hotel;

class HotelRepository implements HotelRepositoryInterface
{
    public function getAll()
    {
        return Hotel::with('destination')->paginate(10);
    }

    public function getById($id)
    {
        return Hotel::with('destination')->findOrFail($id);
    }

    public function create(array $data)
    {
        return Hotel::create($data);
    }

    public function update($id, array $data)
    {
        $hotel = Hotel::findOrFail($id);

        $hotel->update($data);

        return $hotel;
    }

    public function delete($id)
    {
        $hotel = Hotel::findOrFail($id);

        $hotel->delete();

        return true;
    }
}
