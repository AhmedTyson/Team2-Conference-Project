<?php

namespace App\Policies\System;

use App\Enums\AgencyAssignmentStatus;
use App\Models\Account\User;
use App\Models\Commerce\AgencyAssignment;
use App\Models\System\Flag;

class FlagPolicy
{
    public function view(?User $user, Flag $flag): bool
    {
        if (! $user) {
            return false;
        }

        return $user->id === $flag->reporter_id ||
            $user->id === $flag->reviewed_by ||
            $user->hasAnyRole(['admin', 'super_admin']) ||
            $user->email === 'admin@itinera.com' ||
            $user->email === 'admin@threedos.com';
    }

    public function createForAssignment(User $user, AgencyAssignment $assignment): bool
    {
        if ($assignment->status === AgencyAssignmentStatus::REQUESTED) {
            return false;
        }

        return $user->id === $assignment->customer_id ||
            $user->id === $assignment->agency_user_id ||
            $user->hasAnyRole(['admin', 'super_admin']) ||
            $user->email === 'admin@itinera.com' ||
            $user->email === 'admin@threedos.com';
    }

    public function review(?User $user, mixed $flag = null): bool
    {
        if (! $user) {
            return false;
        }

        return $user->hasAnyRole(['admin', 'super_admin']) ||
            $user->email === 'admin@itinera.com' ||
            $user->email === 'admin@threedos.com';
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
