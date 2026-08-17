<?php

namespace App\Repositories\Catalog;

use App\Enums\ReviewStatus;
use App\Interfaces\Catalog\HotelRepositoryInterface;
use App\Models\Catalog\Hotel;
use Illuminate\Database\Eloquent\Collection;

class HotelRepository implements HotelRepositoryInterface
{
    public function getAll()
    {
        $perPage = min((int) request('per_page', 20) ?: 20, 100);

        return Hotel::with('destination')->paginate($perPage);
    }

    public function getById($id)
    {
        return Hotel::with('destination')->findOrFail($id);
    }

    public function getByDestination(int $destinationId): Collection
    {
        return Hotel::query()
            ->where('destination_id', $destinationId)
            ->withCount(['reviews as reviews_count' => fn ($q) => $q->where('status', ReviewStatus::APPROVED->value)])
            ->get();
    }

    public function countAll(): int
    {
        return Hotel::count();
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
