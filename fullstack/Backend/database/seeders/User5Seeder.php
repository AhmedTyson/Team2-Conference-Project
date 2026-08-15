<?php

namespace Database\Seeders;

use App\Models\Account\User;
use App\Models\Catalog\Attraction;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Flight;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Restaurant;
use App\Models\System\Notification;
use App\Models\Trips\AiRecommendation;
use App\Models\Trips\Favourite;
use App\Models\Trips\ItineraryItem;
use App\Models\Trips\Review;
use App\Models\Trips\Trip;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class User5Seeder extends Seeder
{
    public function run(): void
    {
        // 1. Create or retrieve user5@example.com
        $user = User::firstOrCreate(
            ['email' => 'user5@example.com'],
            [
                'name' => 'User Five',
                'phone' => '+15551234567',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        $user->email_verified_at = $user->email_verified_at ?? now();
        $user->save();

        if (Role::where('name', 'user')->where('guard_name', 'api')->exists() && ! $user->hasRole('user')) {
            $user->assignRole('user');
        }

        // 2. Ensure catalog data exists
        $destinations = Destination::all();
        if ($destinations->isEmpty()) {
            $destinations = collect([
                Destination::create(['name' => 'Paris', 'city_name' => 'Paris', 'description' => 'City of Light', 'latitude' => 48.8566, 'longitude' => 2.3522]),
                Destination::create(['name' => 'Tokyo', 'city_name' => 'Tokyo', 'description' => 'Neon metropolis', 'latitude' => 35.6762, 'longitude' => 139.6503]),
                Destination::create(['name' => 'Cairo', 'city_name' => 'Cairo', 'description' => 'Land of Pharaohs', 'latitude' => 30.0444, 'longitude' => 31.2357]),
            ]);
        }

        $hotels = Hotel::all();
        $restaurants = Restaurant::all();
        $attractions = Attraction::all();
        $flights = Flight::all();

        // 3. Create Sample Trips for user5@example.com
        $tripsData = [
            [
                'title' => 'Paris Luxury Escape',
                'status' => 'booked',
                'travel_style' => 'luxury',
                'no_of_travelers' => 2,
                'no_of_days' => 7,
                'interests' => ['fine dining', 'culture', 'shopping'],
                'start_date' => Carbon::now()->addDays(10),
                'end_date' => Carbon::now()->addDays(17),
                'budget' => 3500.00,
                'dest_name' => 'Paris',
            ],
            [
                'title' => 'Tokyo Sakura Exploration',
                'status' => 'planning',
                'travel_style' => 'cultural',
                'no_of_travelers' => 1,
                'no_of_days' => 7,
                'interests' => ['food', 'sightseeing', 'anime'],
                'start_date' => Carbon::now()->subDays(2),
                'end_date' => Carbon::now()->addDays(5),
                'budget' => 4800.00,
                'dest_name' => 'Tokyo',
            ],
            [
                'title' => 'Cairo Ancient Wonders',
                'status' => 'completed',
                'travel_style' => 'historical',
                'no_of_travelers' => 2,
                'no_of_days' => 7,
                'interests' => ['history', 'pyramids', 'museums'],
                'start_date' => Carbon::now()->subDays(30),
                'end_date' => Carbon::now()->subDays(23),
                'budget' => 2200.00,
                'dest_name' => 'Cairo',
            ],
        ];

        foreach ($tripsData as $tData) {
            $trip = Trip::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'title' => $tData['title'],
                ],
                [
                    'status' => $tData['status'],
                    'travel_style' => $tData['travel_style'],
                    'no_of_travelers' => $tData['no_of_travelers'],
                    'no_of_days' => $tData['no_of_days'],
                    'interests' => $tData['interests'],
                    'start_date' => $tData['start_date'],
                    'end_date' => $tData['end_date'],
                    'budget' => $tData['budget'],
                    'is_public' => false,
                ]
            );

            // Attach Destination
            $matchedDest = $destinations->firstWhere('name', $tData['dest_name']) ?? $destinations->first();
            if ($matchedDest && ! $trip->destinations()->where('destinations.id', $matchedDest->id)->exists()) {
                $trip->destinations()->attach($matchedDest->id, [
                    'day_number' => 1,
                    'visit_order' => 1,
                    'estimated_date' => $trip->start_date,
                    'notes' => 'Primary destination for '.$trip->title,
                ]);
            }

            // Attach Hotel, Restaurant, Attraction if available
            $hotel = $hotels->first();
            if ($hotel && ! $trip->hotels()->where('hotels.id', $hotel->id)->exists()) {
                $trip->hotels()->attach($hotel->id);
                ItineraryItem::firstOrCreate([
                    'trip_id' => $trip->id,
                    'itemable_id' => $hotel->id,
                    'itemable_type' => $hotel->getMorphClass(),
                ], [
                    'day_number' => 1,
                    'item_order' => 1,
                    'type' => 'hotel',
                    'time_slot' => 'morning',
                    'title' => $hotel->name,
                    'notes' => 'Luxury accommodation check-in',
                    'estimated_cost' => $hotel->price_per_night ?? 250.00,
                ]);
            }

            $restaurant = $restaurants->first();
            if ($restaurant && ! $trip->restaurants()->where('restaurants.id', $restaurant->id)->exists()) {
                $trip->restaurants()->attach($restaurant->id);
                ItineraryItem::firstOrCreate([
                    'trip_id' => $trip->id,
                    'itemable_id' => $restaurant->id,
                    'itemable_type' => $restaurant->getMorphClass(),
                ], [
                    'day_number' => 1,
                    'item_order' => 2,
                    'type' => 'restaurant',
                    'time_slot' => 'evening',
                    'title' => $restaurant->name,
                    'notes' => 'Fine dining dinner reservation',
                    'estimated_cost' => 80.00,
                ]);
            }

            $attraction = $attractions->first();
            if ($attraction && ! $trip->attractions()->where('attractions.id', $attraction->id)->exists()) {
                $trip->attractions()->attach($attraction->id);
                ItineraryItem::firstOrCreate([
                    'trip_id' => $trip->id,
                    'itemable_id' => $attraction->id,
                    'itemable_type' => $attraction->getMorphClass(),
                ], [
                    'day_number' => 1,
                    'item_order' => 3,
                    'type' => 'attraction',
                    'time_slot' => 'afternoon',
                    'title' => $attraction->name,
                    'notes' => 'Guided cultural tour',
                    'estimated_cost' => 30.00,
                ]);
            }

            // AI Recommendation
            if (! AiRecommendation::where('trip_id', $trip->id)->exists()) {
                AiRecommendation::create([
                    'trip_id' => $trip->id,
                    'prompt_text' => 'Suggest luxury dining and cultural stops in '.$tData['dest_name'],
                    'response_text' => 'Recommended 5-star dining experience, private museum tour, and luxury spa reservation.',
                    'generated_at' => (string) now(),
                    'model_used' => 'groq-llama3',
                    'tokens_used' => '450',
                ]);
            }
        }

        // 4. Create Favourites for user5@example.com
        if ($hotel = $hotels->first()) {
            Favourite::firstOrCreate([
                'user_id' => $user->id,
                'favorable_type' => $hotel->getMorphClass(),
                'favorable_id' => $hotel->id,
            ]);
        }
        if ($matchedDest = $destinations->first()) {
            Favourite::firstOrCreate([
                'user_id' => $user->id,
                'favorable_type' => $matchedDest->getMorphClass(),
                'favorable_id' => $matchedDest->id,
            ]);
        }

        // 5. Create Reviews for user5@example.com
        if ($hotel = $hotels->first()) {
            Review::firstOrCreate([
                'user_id' => $user->id,
                'reviewable_type' => $hotel->getMorphClass(),
                'reviewable_id' => $hotel->id,
            ], [
                'rating' => 5,
                'comment' => 'Exquisite stay! Superb room service and breathtaking views.',
                'status' => 'approved',
            ]);
        }

        // 6. Create Notifications for user5@example.com
        $notifs = [
            ['title' => 'Trip Confirmed', 'body' => 'Your trip "Paris Luxury Escape" has been confirmed!', 'type' => 'trip', 'status' => 'unread'],
            ['title' => 'Special Offer', 'body' => 'Exclusive 20% discount on luxury suites in Tokyo.', 'type' => 'promo', 'status' => 'read'],
            ['title' => 'Weather Alert', 'body' => 'Sunny conditions expected for your upcoming travel.', 'type' => 'info', 'status' => 'unread'],
        ];

        foreach ($notifs as $n) {
            Notification::firstOrCreate([
                'user_id' => $user->id,
                'title' => $n['title'],
            ], [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'body' => $n['body'],
                'type' => $n['type'],
                'status' => $n['status'],
                'read_at' => $n['status'] === 'read' ? now() : null,
            ]);
        }
    }
}
