<?php

namespace App\Events\Commerce;

use App\Models\Commerce\AgencyAssignment;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AgencyAssignmentDeclined
{
    use Dispatchable, SerializesModels;

    public function __construct(public AgencyAssignment $assignment) {}
}
