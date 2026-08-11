<?php

namespace Tests\Feature\Account;

use App\Models\Account\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleMassAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_create_persists_name_and_guard_name(): void
    {
        $role = Role::create(['name' => 'moderator', 'guard_name' => 'api']);

        $this->assertDatabaseHas('roles', [
            'id' => $role->id,
            'name' => 'moderator',
            'guard_name' => 'api',
        ]);
    }

    public function test_role_create_ignores_unknown_mass_assigned_attributes(): void
    {
        $role = Role::create([
            'name' => 'curator',
            'guard_name' => 'api',
            'is_hidden' => 1,
            'is_system' => 1,
        ]);

        $this->assertNotNull($role->id);
        $this->assertNull($role->getAttribute('is_hidden'));
        $this->assertNull($role->getAttribute('is_system'));

        $fresh = Role::find($role->id);
        $this->assertNotNull($fresh);
        $this->assertEquals('curator', $fresh->name);
    }

    public function test_role_fillable_excludes_internal_columns(): void
    {
        $role = new Role;

        $this->assertEquals(['name', 'guard_name'], $role->getFillable());
    }

    public function test_role_still_supports_permission_sync_after_fillable_lock(): void
    {
        $role = Role::create(['name' => 'editor', 'guard_name' => 'api']);

        $permission = \Spatie\Permission\Models\Permission::create([
            'name' => 'edit content',
            'guard_name' => 'api',
        ]);

        $role->syncPermissions([$permission]);

        $this->assertTrue($role->hasPermissionTo('edit content'));
        $this->assertEqualsCanonicalizing(
            ['edit content'],
            $role->permissions->pluck('name')->all()
        );
    }
}