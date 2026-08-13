<?php

namespace App\Services\Catalog\Fixtures;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FlightFixtureService
{
    public const AIRPORTS_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat';

    public const ROUTES_URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat';

    public function sync(?int $limit = null): array
    {
        try {
            $airports = $this->fetchAirports();
            if (empty($airports)) {
                throw new \Exception('No airports loaded from OpenFlights');
            }

            $routes = $this->fetchRoutes();
            if (empty($routes)) {
                throw new \Exception('No routes loaded from OpenFlights');
            }

            $flights = [];
            $max = $limit ?? 500;

            foreach ($routes as $route) {
                if (count($flights) >= $max) {
                    break;
                }

                $departureIata = $route['departure_airport'];
                $arrivalIata = $route['arrival_airport'];

                if (! isset($airports[$departureIata]) || ! isset($airports[$arrivalIata])) {
                    continue;
                }

                $from = $airports[$departureIata];
                $to = $airports[$arrivalIata];

                $distance = $this->haversine($from['lat'], $from['lng'], $to['lat'], $to['lng']);
                $durationHours = max(0.75, ($distance / 850.0) + 0.5);
                $price = $this->priceForDistance($distance);

                $departure = now()->addDays(rand(3, 45))->setTime(rand(0, 23), rand(0, 59));
                $arrival = $departure->copy()->addMinutes((int) round($durationHours * 60));

                $flights[] = [
                    'departure_airport' => $departureIata,
                    'arrival_airport' => $arrivalIata,
                    'departure_date' => $departure->format('Y-m-d H:i:s'),
                    'arrival_date' => $arrival->format('Y-m-d H:i:s'),
                    'price' => $price,
                ];
            }

            if (empty($flights)) {
                throw new \Exception('No valid routes produced from OpenFlights data');
            }

            return $flights;
        } catch (\Exception $e) {
            Log::warning('FlightFixtureService failed: '.$e->getMessage());
            throw $e;
        }
    }

    private function fetchAirports(): array
    {
        $response = Http::timeout(30)->get(self::AIRPORTS_URL);
        if (! $response->successful()) {
            throw new \Exception('OpenFlights airports returned status: '.$response->status());
        }

        $airports = [];
        foreach (explode("\n", $response->body()) as $line) {
            $row = str_getcsv($line);
            if (count($row) < 8) {
                continue;
            }
            $iata = strtoupper(trim($row[4]));
            if ($iata === '' || $iata === '\\N' || ! $this->isIata($iata)) {
                continue;
            }
            $airports[$iata] = [
                'name' => $row[1],
                'city' => $row[2],
                'country' => $row[3],
                'lat' => (float) $row[6],
                'lng' => (float) $row[7],
            ];
        }

        return $airports;
    }

    private function fetchRoutes(): array
    {
        $response = Http::timeout(30)->get(self::ROUTES_URL);
        if (! $response->successful()) {
            throw new \Exception('OpenFlights routes returned status: '.$response->status());
        }

        $routes = [];
        foreach (explode("\n", $response->body()) as $line) {
            $row = str_getcsv($line);
            if (count($row) < 9) {
                continue;
            }
            $departureIata = strtoupper(trim($row[2]));
            $arrivalIata = strtoupper(trim($row[4]));
            $stops = $row[7] ?? '0';

            if ($departureIata === '\\N' || $arrivalIata === '\\N' || $departureIata === '' || $arrivalIata === '') {
                continue;
            }
            if (! is_numeric($stops) || (int) $stops > 0) {
                continue;
            }
            if (! $this->isIata($departureIata) || ! $this->isIata($arrivalIata)) {
                continue;
            }

            $routes[] = [
                'departure_airport' => $departureIata,
                'arrival_airport' => $arrivalIata,
            ];
        }

        return $routes;
    }

    private function isIata(string $code): bool
    {
        return strlen($code) === 3 && preg_match('/^[A-Z]+$/', $code) === 1;
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadiusKm = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $earthRadiusKm * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function priceForDistance(float $distanceKm): float
    {
        $base = 55.0 + $distanceKm * 0.12;
        $noise = mt_rand(-15, 20) / 100.0 * $base;

        return round(max(49.0, $base + $noise), 2);
    }
}
