<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ItineraryItem;

use App\Models\Attraction;
use App\Models\Hotel;

class ItineraryItemSeeder extends Seeder
{
    public function run(): void
    {
        $attraction = Attraction::first();
$hotel = Hotel::first();

ItineraryItem::create([
    'trip_id' => 2,
    'itemable_type' => Attraction::class,
    'itemable_id' => $attraction->id,
    'day_number' => 1,
    'item_order' => 1,
    'type' => 'attraction',
    'time_slot' => '09:00',
    'title' => 'Visit Attraction',
    'notes' => '',
    'estimated_cost' => 100,
]);

ItineraryItem::create([
    'trip_id' => 2,
    'itemable_type' => Hotel::class,
    'itemable_id' => $hotel->id,
    'day_number' => 1,
    'item_order' => 2,
    'type' => 'hotel',
    'time_slot' => '18:00',
    'title' => 'Check in',
    'notes' => '',
    'estimated_cost' => 300,
]);
    }
}