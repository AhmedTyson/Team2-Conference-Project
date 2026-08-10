<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $superAdminPermissions = [
            'assign admins',
        ];

        $adminPermissions = [
            'manage users',
            'manage trips',
            'manage destinations',
            'manage categories',
            'manage hotels',
            'manage restaurants',
            'manage attractions',
            'manage reviews',
            'manage contacts',
            'manage settings',
            'view analytics',
            'manage countries',
            'manage plans',
            'manage flights',
        ];

        $userPermissions = [
            'manage own profile',
            'create trips',
            'manage own trips',
            'generate ai itineraries',
            'write reviews',
            'manage own favourites',
            'get plans',
            'subscribe to plans',
            'upgrade plans',
            'cancel subscription',
            'view my subscription',
        ];

        $agencyPermissions = [
            'catalog.hotels.view', 
            'catalog.restaurants.view',
            'catalog.attractions.view', 
            'catalog.flights.view',
            'catalog.destinations.view',
        ];

        $allPermissions = array_merge($superAdminPermissions, $adminPermissions, $userPermissions, $agencyPermissions);
        foreach ($allPermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'api']);
        }

        $superAdminRole = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'api']);
        $superAdminRole->syncPermissions(array_merge($superAdminPermissions, $adminPermissions));

        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $adminRole->syncPermissions($adminPermissions);

        $userRole = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'api']);
        $userRole->syncPermissions($userPermissions);

        $agencyRole = Role::firstOrCreate(['name' => 'agency', 'guard_name' => 'api']);
        $agencyRole->givePermissionTo($agencyPermissions);
    }
}
