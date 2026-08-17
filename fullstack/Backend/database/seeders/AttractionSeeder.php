<?php

namespace Database\Seeders;

use App\Models\Catalog\Attraction;
use App\Models\Catalog\Category;
use App\Models\Catalog\Destination;
use Illuminate\Database\Seeder;

class AttractionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $path = database_path('seeders/fixtures/attractions.json');

        if (! function_exists('database_path')) {
            $path = __DIR__.'/fixtures/attractions.json';
        }

        if (! file_exists($path)) {
            echo "Fixture not found: {$path}\n";

            return;
        }

        $realAttractions = json_decode(file_get_contents($path), true) ?: [];

        foreach ($realAttractions as $attrData) {
            $dest = Destination::where('name', 'like', '%'.$attrData['city'].'%')
                ->orWhere('city_name', 'like', '%'.$attrData['city'].'%')
                ->first();

            if (! $dest) {
                $dest = Destination::factory()->create([
                    'name' => $attrData['city'],
                    'city_name' => $attrData['city'],
                ]);
            }

            $cat = Category::where('name', $attrData['category'])->first();
            if (! $cat) {
                $cat = Category::firstOrCreate(
                    ['name' => $attrData['category']],
                    ['type' => 'attraction']
                );
            }

            Attraction::updateOrCreate(
                ['name' => $attrData['name']],
                [
                    'destination_id' => $dest->id,
                    'category_id' => $cat->id,
                    'description' => $attrData['description'],
                    'image' => $attrData['image'],
                    'latitude' => $attrData['lat'],
                    'longitude' => $attrData['lng'],
                ]
            );
        }
    }
}
