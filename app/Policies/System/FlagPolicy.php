<?php

namespace App\Policies\System;

use App\Models\Account\User;
use App\Models\Commerce\Flag;
use Illuminate\Auth\Access\Response;

class FlagPolicy
{
    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Flag $flag): bool
    {
        return $user->id === $flag->customer_id || 
            $user->id === $flag->agency_user_id || 
            $user->hasRole('admin') || 
            $user->hasRole('super_admin');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        if ($user->isCustomer()) {
            return $user->agencyAssignment()->status === 'agency_approved';
        }
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Flag $flag): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Flag $flag): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Flag $flag): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Flag $flag): bool
    {
        return false;
    }
}
