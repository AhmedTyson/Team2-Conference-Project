<?php

namespace App\Services\System;

use App\Enums\FlagStatus;
use App\Interfaces\System\FlagRepositoryInterface;
use App\Models\Account\User;
use App\Models\Commerce\AgencyAssignment;
use App\Models\System\Flag;

class FlagService
{
    public function __construct(
        private FlagRepositoryInterface $repository
    ) {}

    public function fileComplaint(User $reporter, AgencyAssignment $assignment, string $reason, ?string $details = null): Flag
    {
        return $this->repository->create([
            'reporter_id' => $reporter->id,
            'flaggable_type' => User::class,
            'flaggable_id' => $assignment->agency_user_id,
            'agency_assignment_id' => $assignment->id,
            'reason' => $reason,
            'details' => $details,
            'status' => FlagStatus::PENDING,
        ]);
    }

    public function approve(Flag $flag, User $reviewer): Flag
    {
        $this->repository->update($flag, [
            'status' => FlagStatus::APPROVED,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
        ]);

        return $flag->fresh() ?? $flag;
    }

    public function decline(Flag $flag, User $reviewer): Flag
    {
        $this->repository->update($flag, [
            'status' => FlagStatus::DECLINED,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
        ]);

        return $flag->fresh() ?? $flag;
    }
}