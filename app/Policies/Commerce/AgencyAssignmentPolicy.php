<?php

namespace App\Policies\Commerce;

use App\Models\Account\User;
use App\Models\Commerce\AgencyAssignment;

class AgencyAssignmentPolicy
{
    public function view(User $user, AgencyAssignment $assignment): bool
    {
        return $user->id === $assignment->customer_id || 
               $user->id === $assignment->agency_user_id || 
               $user->hasRole('admin') || 
               $user->hasRole('super_admin');
    }

    public function approve(User $user, AgencyAssignment $assignment): bool
    {
        return $user->hasRole('admin') || $user->hasRole('super_admin');
    }

    public function respondAsAgency(User $user, AgencyAssignment $assignment): bool
    {
        return $user->id === $assignment->agency_user_id;
    }

    public function cancel(User $user, AgencyAssignment $assignment): bool
    {
        return $user->id === $assignment->customer_id;
    }
}
