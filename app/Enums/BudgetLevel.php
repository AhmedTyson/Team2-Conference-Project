<?php

namespace App\Enums;

enum BudgetLevel: string
{
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';
    case LUXURY = 'luxury';
}
