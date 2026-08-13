<?php

namespace App\Services\Catalog;

use App\Interfaces\Catalog\FlightRepositoryInterface;
use Illuminate\Support\Facades\Http;

class FlightService
{
    protected $flightRepository;

    public function __construct(FlightRepositoryInterface $flightRepository)
    {
        $this->flightRepository = $flightRepository;
    }

    public function getAdminList(bool $trashed = false)
    {
        return $this->flightRepository->getForAdmin($trashed);
    }

    public function getPublicList()
    {
        return $this->flightRepository->getForPublic();
    }

    public function show($id)
    {
        return $this->flightRepository->findById($id);
    }

    public function store(array $data)
    {
        if (($data['source'] ?? 'manual') === 'external') {
            return $this->createFromExternalApi($data);
        }

        return $this->flightRepository->create($data);
    }

    public function update($id, array $data)
    {
        $flight = $this->flightRepository->findById($id);

        return $this->flightRepository->update($flight, $data);
    }

    public function destroy($id)
    {
        $flight = $this->flightRepository->findById($id);

        return $this->flightRepository->delete($flight);
    }

    private function createFromExternalApi(array $data)
    {
        $key = config('services.rapidapi.key');
        $host = config('services.rapidapi.flights_host');

        if (empty($key)) {
            return $this->flightRepository->create([
                'airline' => $data['airline'] ?? fake()->randomElement(['EgyptAir', 'Emirates', 'Qatar Airways', 'Lufthansa']),
                'flight_number' => $data['flight_number'] ?? (strtoupper(fake()->lexify('??')).fake()->numberBetween(100, 999)),
                'departure_airport' => $data['departure_airport'],
                'arrival_airport' => $data['arrival_airport'],
                'departure_date' => $data['departure_date'],
                'arrival_date' => $data['arrival_date'] ?? date('Y-m-d H:i:s', strtotime($data['departure_date'].' + 6 hours')),
                'price' => $data['price'] ?? fake()->randomFloat(2, 200, 1500),
                'booking_status' => $data['booking_status'] ?? 'pending',
            ]);
        }

        $response = Http::withHeaders([
            'X-RapidAPI-Key' => $key,
            'X-RapidAPI-Host' => $host,
        ])->timeout(15)->get('https://'.$host.'/flights/create-session', [
            'o1' => $data['departure_airport'],
            'd1' => $data['arrival_airport'],
            'dd1' => date('Y-m-d', strtotime($data['departure_date'])),
            'currency' => 'USD',
        ]);

        abort_if(! $response->successful(), 502, 'RapidAPI request failed.');

        $result = $response->json();

        if (empty($result['data']['flights']) && empty($result['itineraries'])) {
            return $this->flightRepository->create([
                'airline' => $data['airline'] ?? fake()->randomElement(['EgyptAir', 'Emirates', 'Qatar Airways', 'Lufthansa']),
                'flight_number' => $data['flight_number'] ?? (strtoupper(fake()->lexify('??')).fake()->numberBetween(100, 999)),
                'departure_airport' => $data['departure_airport'],
                'arrival_airport' => $data['arrival_airport'],
                'departure_date' => $data['departure_date'],
                'arrival_date' => $data['arrival_date'] ?? date('Y-m-d H:i:s', strtotime($data['departure_date'].' + 6 hours')),
                'price' => $data['price'] ?? fake()->randomFloat(2, 200, 1500),
                'booking_status' => $data['booking_status'] ?? 'pending',
            ]);
        }

        $airline = $result['data']['flights'][0]['airline']['name'] ?? 'EgyptAir';
        $flightNumber = $result['data']['flights'][0]['flight_number'] ?? 'MS'.rand(100, 999);
        $price = $result['data']['flights'][0]['price'] ?? rand(300, 800);

        return $this->flightRepository->create([
            'airline' => $airline,
            'flight_number' => $flightNumber,
            'departure_airport' => $data['departure_airport'],
            'arrival_airport' => $data['arrival_airport'],
            'departure_date' => $data['departure_date'],
            'arrival_date' => $data['arrival_date'] ?? date('Y-m-d H:i:s', strtotime($data['departure_date'].' + 6 hours')),
            'price' => $price,
            'booking_status' => $data['booking_status'] ?? 'pending',
        ]);
    }
}
