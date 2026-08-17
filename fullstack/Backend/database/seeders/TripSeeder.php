<?php

namespace Database\Seeders;

use App\Models\Account\User;
use App\Models\Catalog\Attraction;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Restaurant;
use App\Models\Trips\ItineraryItem;
use App\Models\Trips\Trip;
use Illuminate\Database\Seeder;

class TripSeeder extends Seeder
{
    public function run(): void
    {
        $travelers = User::whereHas('roles', function ($q) {
            $q->where('name', 'user');
        })->get();

        if ($travelers->isEmpty()) {
            $travelers = User::factory(5)->create();
        }

        $curatedPublicTrips = [
            [
                'title' => 'Valencia & Costa Blanca Escape',
                'travel_style' => 'cultural',
                'no_of_travelers' => 2,
                'budget' => 1500,
                'no_of_days' => 6,
                'estimated_cost' => 1299,
                'is_public' => true,
            ],
            [
                'title' => 'Lofoten Islands Northern Lights',
                'travel_style' => 'adventure',
                'no_of_travelers' => 2,
                'budget' => 2000,
                'no_of_days' => 7,
                'estimated_cost' => 1600,
                'is_public' => true,
            ],
            [
                'title' => 'Gramado Mountain Haven',
                'travel_style' => 'relaxation',
                'no_of_travelers' => 4,
                'budget' => 2500,
                'no_of_days' => 6,
                'estimated_cost' => 2000,
                'is_public' => true,
            ],
            [
                'title' => 'Tenerife Island Sunshine',
                'travel_style' => 'relaxation',
                'no_of_travelers' => 2,
                'budget' => 2400,
                'no_of_days' => 8,
                'estimated_cost' => 2199,
                'is_public' => true,
            ],
            [
                'title' => 'Kyoto Ancient Temples & Bamboo Trail',
                'travel_style' => 'cultural',
                'no_of_travelers' => 2,
                'budget' => 2200,
                'no_of_days' => 5,
                'estimated_cost' => 1750,
                'is_public' => true,
            ],
            [
                'title' => 'Cairo & Giza Pharaonic Trail',
                'travel_style' => 'cultural',
                'no_of_travelers' => 3,
                'budget' => 1400,
                'no_of_days' => 6,
                'estimated_cost' => 1100,
                'is_public' => true,
            ],
        ];

        foreach ($curatedPublicTrips as $idx => $data) {
            $user = $travelers[$idx % $travelers->count()];

            $trip = Trip::updateOrCreate(
                ['title' => $data['title']],
                [
                    'user_id' => $user->id,
                    'travel_style' => $data['travel_style'],
                    'no_of_travelers' => $data['no_of_travelers'],
                    'budget' => $data['budget'],
                    'no_of_days' => $data['no_of_days'],
                    'estimated_cost' => $data['estimated_cost'],
                    'is_public' => true,
                    'start_date' => now()->addDays(10 + $idx * 5)->toDateString(),
                    'end_date' => now()->addDays(10 + $idx * 5 + $data['no_of_days'])->toDateString(),
                    'status' => 'planning',
                ]
            );

            // Attach destinations
            $dest = Destination::where('city_name', 'LIKE', '%'.strtok($data['title'], ' ').'%')->first()
                ?? Destination::inRandomOrder()->first();
            if ($dest) {
                $trip->destinations()->syncWithoutDetaching([$dest->id => ['day_number' => 1, 'visit_order' => 1]]);
            }

            // Attach hotel
            $hotel = Hotel::inRandomOrder()->first();
            if ($hotel) {
                $trip->hotels()->syncWithoutDetaching([$hotel->id]);
            }

            // Attach attraction
            $attraction = Attraction::inRandomOrder()->first();
            if ($attraction) {
                $trip->attractions()->syncWithoutDetaching([$attraction->id]);
            }

            // Attach restaurant
            $restaurant = Restaurant::inRandomOrder()->first();
            if ($restaurant) {
                $trip->restaurants()->syncWithoutDetaching([$restaurant->id]);
            }

            $this->seedItineraryItems($trip);
        }

        $this->command?->info('Seeded public community trips with real destination relations.');
    }

    private function seedItineraryItems(Trip $trip): void
    {
        $trip->loadMissing(['hotels', 'restaurants', 'attractions', 'flights']);
        $order = 1;

        foreach ($trip->hotels as $hotel) {
            ItineraryItem::updateOrCreate(
                ['trip_id' => $trip->id, 'itemable_id' => $hotel->id, 'itemable_type' => $hotel->getMorphClass()],
                [
                    'day_number' => 1,
                    'item_order' => $order++,
                    'type' => 'hotel',
                    'title' => $hotel->name,
                    'time_slot' => 'Morning Check-in',
                    'notes' => 'Confirmed hotel stay',
                    'estimated_cost' => $hotel->price_per_night ?? 0,
                ]
            );
        }

        foreach ($trip->attractions as $attraction) {
            ItineraryItem::updateOrCreate(
                ['trip_id' => $trip->id, 'itemable_id' => $attraction->id, 'itemable_type' => $attraction->getMorphClass()],
                [
                    'day_number' => 1,
                    'item_order' => $order++,
                    'type' => 'attraction',
                    'title' => $attraction->name,
                    'time_slot' => 'Afternoon Sightseeing',
                    'notes' => 'Entry tickets included',
                    'estimated_cost' => $attraction->entry_fee ?? 35,
                ]
            );
        }
    }
}
