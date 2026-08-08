<?php

namespace App\Strategies\Checkout;

use Exception;

class CheckoutStrategyFactory
{
    public static function make(string $type): CheckoutStrategyInterface
    {
        return match ($type) {
            'trip_package' => new TripPackageStrategy,
            'trip_fork' => new TripForkStrategy,
            'subscription' => new SubscriptionStrategy,
            default => throw new Exception("Invalid purchase type: {$type}"),
        };
    }
}
