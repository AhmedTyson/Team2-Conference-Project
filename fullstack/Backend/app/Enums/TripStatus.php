<?php

namespace App\Enums;

enum TripStatus: string
{
    case PENDING = 'pending';
    case PLANNING = 'planning';
    case BOOKED = 'booked';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
}
