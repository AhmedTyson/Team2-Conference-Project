<?php

namespace App\Services\System;

use App\Models\System\Flag;
use App\Enums\FlagStatus;
use Illuminate\Support\Facades\Auth;
// assigned to someone in frontend : Hana - 7
class FlagService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function fileComplaint(){}



    public function approve(Flag $flag)
    {
        return $flag->update([
            // todo: does approve() have any automatic side effect 
            // (e.g. cancel the agency_assignment, flag the agency user for admin review on future assignments),
            // or is it purely a logged record for manual admin follow-up? 
            // Implement as a no-op beyond status + reviewed_by/reviewed_at until you confirm — do not guess at automatic consequences.
            // if approved: cancel the agency_assignment
            // if approved: flag the agency user for admin review on future assignments

            ['status' => FlagStatus::APPROVED, 'reviewed_at' => now(), 'reviewed_by' => Auth::id()]
            // if rejected: cancel the agency_assignment
            // if rejected: do not flag the agency user for admin review on future assignments
        ]);
    }




    public function decline(Flag $flag)
    {
        return $flag->update(['status' => FlagStatus::DECLINED, 'reviewed_at' => now(), 'reviewed_by' => Auth::id()]);
    }
}
