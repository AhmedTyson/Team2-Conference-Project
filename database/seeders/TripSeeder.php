<?php

namespace Database\Seeders;

use App\Models\Account\User;
use App\Models\Catalog\Attraction;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Flight;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Restaurant;
use App\Models\Trips\ItineraryItem;
use App\Models\Trips\Trip;
use App\Models\Trips\Trips\AiRecommendation;
use Illuminate\Database\Seeder;

class TripSeeder extends Seeder
{
    public function run(): void
    {
        if (Trip::exists()) {
            $this->command?->warn('Trips already seeded. Skipping TripSeeder.');

            return;
        }

        $travelers = User::whereHas('roles', function ($q) {
            $q->where('name', 'user');
        })->get();

        if ($travelers->isEmpty()) {
            $travelers = User::factory(5)->create();
        }

        $destinations = Destination::limit(10)->get();

        $tripCount = min(8, $travelers->count() * 2);

        for ($i = 0; $i < $tripCount; $i++) {
            $trip = Trip::factory()->create([
                'user_id' => $travelers->random()->id,
            ]);

            // Attach 2-4 destinations to the trip
            $picked = $destinations->count() > 0
                ? $destinations->random(min(4, $destinations->count()))
                : collect([Destination::factory()->create()]);

            $picked->each(function (Destination $destination, int $index) use ($trip) {
                $trip->destinations()->attach($destination, [
                    'day_number' => $index + 1,
                    'visit_order' => $index + 1,
                    'estimated_date' => $trip->start_date->addDays($index),
                    'notes' => 'Day '.($index + 1).' stop',
                ]);
            });

            // Attach 1-3 items of each type
            $items = [
                'hotels' => Hotel::inRandomOrder()->first(),
                'restaurants' => Restaurant::inRandomOrder()->first(),
                'attractions' => Attraction::inRandomOrder()->first(),
                'flights' => Flight::inRandomOrder()->first(),
            ];

            foreach ($items as $relation => $item) {
                if ($item) {
                    $trip->{$relation}()->attach($item);
                }
            }

            // Itinerary items derived from attached items
            $this->seedItineraryItems($trip);

            // AI recommendation per trip
            AiRecommendation::factory()->create(['trip_id' => $trip->id]);
        }

        $this->command?->info("Seeded {$tripCount} trips with destinations, items, itineraries, and AI recommendations.");
    }

    private function seedItineraryItems(Trip $trip): void
    {
        $trip->loadMissing(['hotels', 'restaurants', 'attractions', 'flights']);

        $order = 1;

        foreach ($trip->hotels as $hotel) {
            ItineraryItem::factory()->create([
                'trip_id' => $trip->id,
                'itemable_id' => $hotel->id,
                'itemable_type' => $hotel->getMorphClass(),
                'day_number' => 1,
                'item_order' => $order++,
                'type' => 'hotel',
                'title' => $hotel->name,
                'estimated_cost' => $hotel->price_per_night ?? 0,
            ]);
        }

        foreach ($trip->restaurants as $restaurant) {
            ItineraryItem::factory()->create([
                'trip_id' => $trip->id,
                'itemable_id' => $restaurant->id,
                'itemable_type' => $restaurant->getMorphClass(),
                'day_number' => 1,
                'item_order' => $order++,
                'type' => 'restaurant',
                'title' => $restaurant->name,
            ]);
        }

        foreach ($trip->attractions as $attraction) {
            ItineraryItem::factory()->create([
                'trip_id' => $trip->id,
                'itemable_id' => $attraction->id,
                'itemable_type' => $attraction->getMorphClass(),
                'day_number' => 1,
                'item_order' => $order++,
                'type' => 'attraction',
                'title' => $attraction->name,
            ]);
        }

        foreach ($trip->flights as $flight) {
            ItineraryItem::factory()->create([
                'trip_id' => $trip->id,
                'itemable_id' => $flight->id,
                'itemable_type' => $flight->getMorphClass(),
                'day_number' => 1,
                'item_order' => $order++,
                'type' => 'flight',
                'title' => $flight->airline.' '.$flight->flight_number,
                'estimated_cost' => $flight->price ?? 0,
            ]);
        }
    }
}
