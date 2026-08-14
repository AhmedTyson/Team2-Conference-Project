<?php

namespace App\Repositories\Catalog;

use App\Interfaces\Catalog\DestinationRepositoryInterface;
use App\Models\Catalog\Destination;
use App\Models\Trips\Trip;
use Illuminate\Database\Eloquent\Collection;

class DestinationRepository implements DestinationRepositoryInterface
{
    public function getAll(array $filters = []): Collection
    {
        return Destination::query()
            ->with('country.region')
            ->withCount(['hotels', 'trips'])
            ->when(
                ! empty($filters['region']) && $filters['region'] !== 'all',
                fn ($q) => $q->whereHas('country.region', fn ($r) => $r->where('key', $filters['region']))
            )
            ->when(! empty($filters['query']), fn ($q) => $q->where(function ($w) use ($filters) {
                $w->where('name', 'like', "%{$filters['query']}%")
                    ->orWhere('city_name', 'like', "%{$filters['query']}%")
                    ->orWhereHas('country', fn ($c) => $c->where('name', 'like', "%{$filters['query']}%"));
            }))
            ->get();
    }

    public function getById($id): Destination
    {
        return Destination::with('country')->findOrFail($id);
    }

    public function getDetail($id): Destination
    {
        return Destination::with('country.region')
            ->withCount(['hotels', 'trips'])
            ->findOrFail($id);
    }

    public function countDistinctTripUsers(int $destinationId): int
    {
        return Trip::query()
            ->whereHas('destinations', fn ($q) => $q->where('destinations.id', $destinationId))
            ->distinct()
            ->count('user_id');
    }

    public function getForTripCreation()
    {
        return Destination::query()
            ->select('id', 'name', 'city_name', 'image')
            ->orderBy('name')
            ->get();
    }
}
