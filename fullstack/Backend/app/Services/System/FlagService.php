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
        // Agencies file complaints against the assignment's customer;
        // customers file complaints against the assignment's agency.
        $isAgencyReporter = (int) $reporter->id === (int) $assignment->agency_user_id;
        $subject = $assignment->load(['customer', 'agency']);

        $flag = $this->repository->create([
            'reporter_id'          => $reporter->id,
            'flaggable_type'       => 'user',
            'flaggable_id'         => $isAgencyReporter
                ? $assignment->customer_id
                : $assignment->agency_user_id,
            'agency_assignment_id' => $assignment->id,
            'reason'               => $reason,
            'details'              => $details,
            'status'               => FlagStatus::PENDING,
        ]);

        $admins = User::role('admin')->get();
        foreach ($admins as $admin) {
            if ($isAgencyReporter) {
                $admin->notify(new \App\Notifications\SystemNotification(
                    'User Complaint Filed',
                    "Agency {$reporter->name} reported customer {$subject->customer?->name} regarding assignment #{$assignment->id}.",
                    '/admin/flags'
                ));
            } else {
                $admin->notify(new \App\Notifications\SystemNotification(
                    'Agency Complaint Filed',
                    "Customer {$reporter->name} filed a complaint regarding assignment #{$assignment->id}.",
                    '/admin/flags'
                ));
            }
        }

        return $flag;
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
