<?php

namespace App\Support\Enums;

enum BudgetTier: string
{
    case Economy = 'economy';
    case Standard = 'standard';
    case Premium = 'premium';

    public function priceMultiplier(): float
    {
        return match($this) {
            self::Economy => 1.0,
            self::Standard => 1.5,
            self::Premium => 2.0,
        };
    }

    public function maxTravelers(): int
    {
        return match($this) {
            self::Economy => 2,
            self::Standard => 4,
            self::Premium => 8,
        };
    }

    public function description(): string
    {
        return match($this) {
            self::Economy => 'Budget-friendly option',
            self::Standard => 'Comfortable experience',
            self::Premium => 'Luxury experience',
        };
    }
}