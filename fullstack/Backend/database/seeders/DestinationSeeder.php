<?php

namespace Database\Seeders;

use App\Models\Catalog\Destination;
use Illuminate\Database\Seeder;

class DestinationSeeder extends Seeder
{
    public function run(): void
    {
        Destination::factory()->count(20)->create();
    }
}
