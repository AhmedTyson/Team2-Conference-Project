<?php

namespace App\Jobs;

use App\Models\Catalog\Destination;
use App\Services\Catalog\Fixtures\OpenStreetService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GeocodeDestinationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public Destination $destination) {}

    public function handle(OpenStreetService $maps): void
    {
        $destination = $this->destination->fresh();

        if (! $destination || ($destination->latitude && $destination->longitude)) {
            return;
        }

        $query = "{$destination->name}, {$destination->city_name}";
        $coords = $maps->getCoordinates($query);

        if ($coords) {
            $destination->update([
                'latitude' => $coords['lat'],
                'longitude' => $coords['lng'],
            ]);
        }
    }
}
