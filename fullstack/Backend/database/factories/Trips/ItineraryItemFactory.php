<?php

namespace Database\Factories\Trips;

use App\Models\Catalog\Hotel;
use App\Models\Trips\ItineraryItem;
use App\Models\Trips\Trip;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ItineraryItem>
 */
class ItineraryItemFactory extends Factory
{
    protected $model = ItineraryItem::class;

    public function definition(): array
    {
        return [
            'trip_id' => Trip::factory(),
            'itemable_id' => Hotel::factory(),
            'itemable_type' => Hotel::class,
            'day_number' => fake()->numberBetween(1, 10),
            'item_order' => fake()->numberBetween(1, 10),
            'type' => fake()->randomElement(['hotel', 'restaurant', 'attraction', 'flight']),
            'time_slot' => fake()->randomElement(['morning', 'afternoon', 'evening', 'night']),
            'title' => fake()->words(3, true),
            'notes' => fake()->sentence(),
            'estimated_cost' => fake()->randomFloat(2, 10, 800),
        ];
    }
}
