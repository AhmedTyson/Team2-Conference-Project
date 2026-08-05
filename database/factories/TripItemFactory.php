<?php

namespace Database\Factories;

use App\Models\Hotel;
use App\Models\Trip;
use App\Models\TripItem;
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
