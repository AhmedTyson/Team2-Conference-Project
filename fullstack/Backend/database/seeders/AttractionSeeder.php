<?php

namespace Database\Seeders;

use App\Models\Catalog\Attraction;
use Illuminate\Database\Seeder;

class AttractionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Attraction::factory()->count(20)->create();
    }
}
