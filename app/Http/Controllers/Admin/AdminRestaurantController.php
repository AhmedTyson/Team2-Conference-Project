<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use App\Http\Requests\Admin\StoreRestaurantRequest;
use App\Http\Requests\Admin\UpdateRestaurantRequest;
use App\Models\Destination;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class AdminRestaurantController extends Controller
{
    // get data from db 
    public function index(): JsonResponse
    {
        $restaurants = Restaurant::with(['destination', 'category'])->get();
        return response()->json([
            'success' => true,
            'data' => $restaurants
        ]);
    }
    // stores data from RapidAPI (shadowing) or admin manually inserts restaurant
    public function store(StoreRestaurantRequest $request): JsonResponse
      {
        $data = $request->validated();
        $restaurant = ($data['source'] ?? 'manual') === 'external'
            ? $this->createFromExternalApi($data)
            : Restaurant::create($data);
        return response()->json([
            'success' => true,
            'message' => 'Restaurant created successfully.',
            'data' => $restaurant->load(['destination', 'category'])
        ], 201);
    }
    public function update(UpdateRestaurantRequest $request, int $id): JsonResponse
    {
        $restaurant = Restaurant::findOrFail($id);
        $restaurant->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Restaurant updated successfully.',
            'data' => $restaurant->load(['destination', 'category'])
        ]);
    }
    public function destroy(int $id): JsonResponse
    {
        $restaurant = Restaurant::findOrFail($id);
        $restaurant->delete();
        return response()->json([
            'success' => true,
            'message' => 'Restaurant deleted successfully.'
        ]);
    }
    // shadow modelling 
    private function createFromExternalApi(array $data): Restaurant
    {
        $destination = Destination::findOrFail($data['destination_id']);
        // request to RapidAPI, asking for up to 10 restaurants near destination's coordinates
        $response = Http::withHeaders([
            'X-RapidAPI-Key' => config('services.rapidapi.key'),
            'X-RapidAPI-Host' => config('services.rapidapi.restaurants_host'),
        ])->timeout(15)->get('https://' . config('services.rapidapi.restaurants_host') . '/restaurants/list', [
            'latitude' => $destination->latitude,
            'longitude' => $destination->longitude,
            'limit' => 10,
        ]);
        abort_if(!$response->successful(), 502, 'RapidAPI request failed.');
        $results = collect($response->json()['data'] ?? []);
        $match = isset($data['name'])
            ? $results->first(fn ($r) => str_contains(strtolower($r['name'] ?? ''), strtolower($data['name'])))
            : $results->first();
        abort_if(!$match, 422, 'No matching restaurant found from the external API.');
        // translating external api data into database
        return Restaurant::create([
            'name' => $match['name'],
            'cuisine' => $match['cuisine'][0]['name'] ?? 'Local',
            'price_range' => $match['price_level'] ?? '$$',
            'rating' => isset($match['rating']) ? (float) $match['rating'] : 4.0,
            'address' => $match['address'] ?? null,
            'image' => $match['photo']['images']['large']['url'] ?? 'restaurants/default.jpg',
            'destination_id' => $destination->id,
            'category_id' => $data['category_id'] ?? null,
        ]);
    }
}
