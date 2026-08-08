<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFlightRequest;
use App\Http\Requests\Admin\UpdateFlightRequest;
use App\Models\Flight;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class AdminFlightController extends Controller
{
    // Get all flights (for admin panel)

    public function index(): JsonResponse
    {
        $flights = Flight::latest()->get();

        return response()->json([
            'success' => true,
            'data' => $flights,
        ]);
    }

    // Store a new flight (Manual or External TripAdvisor search)

    public function store(StoreFlightRequest $request): JsonResponse
    {
        $data = $request->validated();

        $flight = ($data['source'] ?? 'manual') === 'external'
            ? $this->createFromExternalApi($data)
            : Flight::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Flight created successfully.',
            'data' => $flight,
        ], 201);
    }

    // Update flight details
    public function update(UpdateFlightRequest $request, int $id): JsonResponse
    {
        $flight = Flight::findOrFail($id);
        $flight->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Flight updated successfully.',
            'data' => $flight,
        ]);
    }

    // Delete a flight

    public function destroy(int $id): JsonResponse
    {
        $flight = Flight::findOrFail($id);
        $flight->delete();

        return response()->json([
            'success' => true,
            'message' => 'Flight deleted successfully.',
        ]);
    }

    // Shadow Modeling: Pull data from TripAdvisor Flights API
    private function createFromExternalApi(array $data): Flight
    {
        $key = config('services.rapidapi.key');
        $host = config('services.rapidapi.flights_host');

        // Fallback if no API key is configured (local environment simulation)
        if (empty($key)) {
            return Flight::create([
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

        // Call TripAdvisor Flights search session
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

        // Parse flight details or fallback to generated values if search response has no results
        if (empty($result['data']['flights']) && empty($result['itineraries'])) {
            return Flight::create([
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

        return Flight::create([
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
