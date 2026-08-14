<?php

namespace App\Enums;

enum TripStatus: string
{
    case PENDING = 'pending';
    case PLANNING = 'planning';
    case PLANNED = 'planned';
    case ACTIVE = 'active';
    case BOOKED = 'booked';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
}
