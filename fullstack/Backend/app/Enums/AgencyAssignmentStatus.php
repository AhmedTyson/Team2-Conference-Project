<?php

namespace App\Enums;

enum AgencyAssignmentStatus: string
{
    case REQUESTED = 'requested';
    case ADMIN_APPROVED = 'admin_approved';
    case AGENCY_APPROVED = 'agency_approved';
    case AGENCY_DECLINED = 'agency_declined';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
}
