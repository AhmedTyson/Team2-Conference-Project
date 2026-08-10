<?php

namespace App\Enums;

enum CommissionStatus: string
{
    case PENDING = 'pending';
    case SETTLED = 'settled';
    case CANCELLED = 'cancelled';
}
