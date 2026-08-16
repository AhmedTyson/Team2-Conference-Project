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
        $realAttractions = [
            // Paris
            [
                'city' => 'Paris',
                'name' => 'Eiffel Tower',
                'category' => 'Historical Sites',
                'description' => 'The iconic 330m iron lattice tower on the Champ de Mars in Paris, offering breathtaking panoramic views of the city skyline.',
                'lat' => 48.8584,
                'lng' => 2.2945,
                'image' => 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80'
            ],
            [
                'city' => 'Paris',
                'name' => 'Louvre Museum',
                'category' => 'Museums',
                'description' => 'The world\'s largest art museum and historic monument in Paris, housing landmark masterpieces such as the Mona Lisa and Venus de Milo.',
                'lat' => 48.8606,
                'lng' => 2.3376,
                'image' => 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80'
            ],
            [
                'city' => 'Paris',
                'name' => 'Arc de Triomphe',
                'category' => 'Historical Sites',
                'description' => 'Famous monumental arch honoring French military victories at the western end of the Champs-Élysées.',
                'lat' => 48.8738,
                'lng' => 2.2950,
                'image' => 'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?auto=format&fit=crop&w=800&q=80'
            ],

            // Cairo
            [
                'city' => 'Cairo',
                'name' => 'Great Pyramids of Giza',
                'category' => 'Historical Sites',
                'description' => 'The ancient Wonders of the World featuring Khufu, Khafre, and Menkaure pyramids guarded by the Great Sphinx.',
                'lat' => 29.9792,
                'lng' => 31.1342,
                'image' => 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80'
            ],
            [
                'city' => 'Cairo',
                'name' => 'Grand Egyptian Museum',
                'category' => 'Museums',
                'description' => 'State-of-the-art archaeological museum housing the world\'s largest collection of ancient Egyptian treasures and King Tutankhamun artifacts.',
                'lat' => 29.9950,
                'lng' => 31.1186,
                'image' => 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80'
            ],
            [
                'city' => 'Cairo',
                'name' => 'Khan el-Khalili Bazaar',
                'category' => 'Shopping',
                'description' => 'Historic Islamic Cairo souk famous for handcrafted brassware, spices, jewelry, and traditional coffeehouses.',
                'lat' => 30.0478,
                'lng' => 31.2622,
                'image' => 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?auto=format&fit=crop&w=800&q=80'
            ],

            // Rome
            [
                'city' => 'Rome',
                'name' => 'Colosseum',
                'category' => 'Historical Sites',
                'description' => 'Ancient Roman amphitheatre and global architectural marvel where gladiators competed in antiquity.',
                'lat' => 41.8902,
                'lng' => 12.4922,
                'image' => 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80'
            ],
            [
                'city' => 'Rome',
                'name' => 'Trevi Fountain',
                'category' => 'Historical Sites',
                'description' => 'Baroque masterpiece fountain where visitors toss coins over their shoulder to ensure a future return to Rome.',
                'lat' => 41.9009,
                'lng' => 12.4833,
                'image' => 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80'
            ],

            // Tokyo
            [
                'city' => 'Tokyo',
                'name' => 'Senso-ji Temple',
                'category' => 'Historical Sites',
                'description' => 'Tokyo\'s oldest and most significant Buddhist temple located in Asakusa, featuring the iconic Kaminarimon Gate.',
                'lat' => 35.7148,
                'lng' => 139.7967,
                'image' => 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80'
            ],
            [
                'city' => 'Tokyo',
                'name' => 'Tokyo Tower',
                'category' => 'Nature & Parks',
                'description' => 'Communications and observation tower in the Shiba-koen district of Minato, inspired by the Eiffel Tower.',
                'lat' => 35.6586,
                'lng' => 139.7454,
                'image' => 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'
            ],

            // New York
            [
                'city' => 'New York',
                'name' => 'Statue of Liberty',
                'category' => 'Historical Sites',
                'description' => 'Colossal neoclassical sculpture on Liberty Island in New York Harbor, symbol of freedom and international welcome.',
                'lat' => 40.6892,
                'lng' => -74.0445,
                'image' => 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80'
            ],
            [
                'city' => 'New York',
                'name' => 'Central Park',
                'category' => 'Nature & Parks',
                'description' => 'Expansive urban park in Manhattan featuring scenic bridges, walking trails, lakes, and cultural plazas.',
                'lat' => 40.7851,
                'lng' => -73.9683,
                'image' => 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=800&q=80'
            ],

            // Dubai
            [
                'city' => 'Dubai',
                'name' => 'Burj Khalifa',
                'category' => 'Historical Sites',
                'description' => 'The world\'s tallest skyscraper standing at 828m, featuring observation decks with unprecedented views of Dubai.',
                'lat' => 25.1972,
                'lng' => 55.2744,
                'image' => 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'
            ],
            [
                'city' => 'Dubai',
                'name' => 'Dubai Mall & Fountain',
                'category' => 'Shopping',
                'description' => 'Premier luxury shopping destination and choreographed musical fountain spectacle at the foot of Burj Khalifa.',
                'lat' => 25.1975,
                'lng' => 55.2796,
                'image' => 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80'
            ],

            // London
            [
                'city' => 'London',
                'name' => 'Big Ben & Elizabeth Tower',
                'category' => 'Historical Sites',
                'description' => 'Iconic neo-Gothic clock tower at the north end of the Houses of Parliament along the River Thames.',
                'lat' => 51.5007,
                'lng' => -0.1246,
                'image' => 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'
            ],
            [
                'city' => 'London',
                'name' => 'Tower Bridge',
                'category' => 'Historical Sites',
                'description' => 'Combined bascule and suspension bridge built between 1886 and 1894, an enduring symbol of London.',
                'lat' => 51.5055,
                'lng' => -0.0754,
                'image' => 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=800&q=80'
            ],

            // Sydney
            [
                'city' => 'Sydney',
                'name' => 'Sydney Opera House',
                'category' => 'Historical Sites',
                'description' => 'World-famous multi-venue performing arts centre on Sydney Harbour, designed by Danish architect Jørn Utzon.',
                'lat' => -33.8568,
                'lng' => 151.2153,
                'image' => 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80'
            ]
        ];

        foreach ($realAttractions as $attrData) {
            $dest = Destination::where('name', 'like', '%' . $attrData['city'] . '%')
                ->orWhere('city_name', 'like', '%' . $attrData['city'] . '%')
                ->first();

            if (!$dest) {
                $dest = Destination::factory()->create([
                    'name' => $attrData['city'],
                    'city_name' => $attrData['city']
                ]);
            }

            $cat = Category::where('name', $attrData['category'])->first();
            if (!$cat) {
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
                    'longitude' => $attrData['lng']
                ]
            );
        }
    }
}
