<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Roles & Permissions (Zero Dependencies)
        $this->call(RoleAndPermissionSeeder::class);

        // 2. Base Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@threedos.com'],
            [
                'name' => 'Super Admin',
                'password' => bcrypt('password'),
            ]
        );
        if (!$admin->hasRole('super_admin')) {
            $admin->assignRole('super_admin');
        }

        // Create 10 fake users for interactions
        if (app()->environment('local') && User::where('email', 'like', '%@example.com')->count() === 0) {
            User::factory(10)->create()->each(function ($user) {
                $user->assignRole('user');
            });
        }

        // 3. Temporarily disable FK constraints because colleagues' seeders
        // (Destinations, Categories, Attractions) are missing from this branch.
        // Without this, the Hotel/Restaurant/Review seeders will crash MySQL.
        Schema::disableForeignKeyConstraints();

        // 4. Run ONLY the assigned seeders
        $this->call([
            CountrySeeder::class,
            DestinationSeeder::class,
            CategorySeeder::class,
            HotelSeeder::class,
            RestaurantSeeder::class,
            AttractionSeeder::class,
            FlightSeeder::class,
            NotificationSeeder::class,
            ReviewSeeder::class,
            FavouriteSeeder::class,
            TripSeeder::class,
        ]);

        // 5. Re-enable FK constraints
        Schema::enableForeignKeyConstraints();
    }
}
