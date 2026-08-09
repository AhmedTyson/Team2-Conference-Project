<?php

namespace Database\Factories\Trips;

use App\Models\Catalog\Hotel;
use App\Models\Trips\Trip;
use App\Models\Trips\TripItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TripItem>
 */
class TripItemFactory extends Factory
{
    protected $model = TripItem::class;

    public function definition(): array
    {
        return [
            'trip_id' => Trip::factory(),
            'item_type' => Hotel::class,
            'item_id' => Hotel::factory(),
        ];
    }
}
