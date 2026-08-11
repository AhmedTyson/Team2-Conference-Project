<?php

namespace App\Models\Account;

use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    protected $guard_name = 'api';

    /**
     * Explicitly restrict mass assignment.
     *
     * Spatie's base Role ships with `$guarded = []`, which leaves every
     * column mass-assignable. This model re-locks it to the two fields
     * the package itself writes on create.
     */
    protected $fillable = [
        'name',
        'guard_name',
    ];
}