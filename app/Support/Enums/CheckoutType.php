<?php

namespace App\Support\Enums;

final enum CheckoutType: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Failed = 'failed';
    case Refunded = 'refunded';
    case Cancelled = 'cancelled';

    public function isSuccessful(): bool
    {
        return $this === self::Paid;
    }

    public function isTerminal(): bool
    {
        return in_array($this, [self::Paid, self::Refunded, self::Cancelled, self::Failed]);
    }
}