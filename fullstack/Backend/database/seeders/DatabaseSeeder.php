<?php

namespace Database\Seeders;

use App\Models\Account\User;
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

        // 2. Base Admin User & Demo Accounts
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@threedos.com'],
            [
                'name' => 'Super Admin',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );
        $superAdmin->email_verified_at = $superAdmin->email_verified_at ?? now();
        $superAdmin->save();
        if (! $superAdmin->hasRole('super_admin')) {
            $superAdmin->assignRole('super_admin');
        }

        $admin = User::firstOrCreate(
            ['email' => 'admin@itinera.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );
        $admin->email_verified_at = $admin->email_verified_at ?? now();
        $admin->save();
        if (! $admin->hasRole('admin')) {
            $admin->assignRole('admin');
        }

        $agency = User::firstOrCreate(
            ['email' => 'agency@itinera.com'],
            [
                'name' => 'Agency Partner',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );
        $agency->email_verified_at = $agency->email_verified_at ?? now();
        $agency->save();
        if (! $agency->hasRole('agency')) {
            $agency->assignRole('agency');
        }

        $customer = User::firstOrCreate(
            ['email' => 'customer@itinera.com'],
            [
                'name' => 'Customer Traveler',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );
        $customer->email_verified_at = $customer->email_verified_at ?? now();
        $customer->save();
        if (! $customer->hasRole('user')) {
            $customer->assignRole('user');
        }

        // Create 10 fake users for interactions
        if (app()->environment('local') && User::where('email', 'like', '%@example.com')->count() === 0) {
            User::factory(10)->create()->each(function ($user) {
                $user->email_verified_at = now();
                $user->save();
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
            RegionSeeder::class,
            DestinationSeeder::class,
            CategorySeeder::class,
            HotelSeeder::class,
            RestaurantSeeder::class,
            AttractionSeeder::class,
            FlightSeeder::class,
            ReviewSeeder::class,
            FavouriteSeeder::class,
            TripSeeder::class,
            AddressSeeder::class,
            AgencyAssignmentSeeder::class,
            ContactMessageSeeder::class,
            PaymentSeeder::class,
            BudgetSnapshotSeeder::class,
            NotificationSeeder::class,
            UserPointSeeder::class,
            TripContributionSeeder::class,
            PlanSeeder::class,
            SettingsSeeder::class,
            User5Seeder::class,
            ReportSeeder::class,
        ]);

        // 5. Re-enable FK constraints
        Schema::enableForeignKeyConstraints();
    }
}
