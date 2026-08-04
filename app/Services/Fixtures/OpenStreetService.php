<?php

namespace App\Services\Fixtures;

use Illuminate\Support\Facades\Http;

class OpenStreetService
{
    protected string $userAgent = 'Itinera/1.0 (admin@threedos.com)'; 

    public function getCoordinates(string $address): ?array
    {
        $response = Http::withHeaders(['User-Agent' => $this->userAgent])
            ->get('https://nominatim.openstreetmap.org/search', [
                'q' => $address,
                'format' => 'json',
                'limit' => 1,
            ]);

        if ($response->successful() && !empty($response->json())) {
            $result = $response->json('0');
            return [
                'lat' => (float) $result['lat'],
                'lng' => (float) $result['lon'],
            ];
        }

        return null;
    }
}
