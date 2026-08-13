<?php

namespace App\Policies\System;

use App\Enums\AgencyAssignmentStatus;
use App\Models\Account\User;
use App\Models\Commerce\AgencyAssignment;
use App\Models\System\Flag;

class FlagPolicy
{
    public function view(User $user, Flag $flag): bool
    {
        return $user->id === $flag->reporter_id ||
            $user->id === $flag->reviewed_by ||
            $user->hasRole('admin') ||
            $user->hasRole('super_admin');
    }

    public function createForAssignment(User $user, AgencyAssignment $assignment): bool
    {
        return $user->id === $assignment->customer_id &&
            $assignment->status === AgencyAssignmentStatus::AGENCY_APPROVED;
    }

    public function review(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasRole('super_admin');
    }

    public function update(User $user, Flag $flag): bool
    {
        return false;
    }

    public function delete(User $user, Flag $flag): bool
    {
        return false;
    }
}
