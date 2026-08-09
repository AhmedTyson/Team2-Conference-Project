<?php

namespace App\Services\Commerce;

use App\Models\Commerce\Plan;
use App\Models\System\Setting;
use App\Models\Trips\Trip;

class PriceCalculatorService
{
    /**
     * Get the subscription price directly from the database Plan.
     */
    public function calculateSubscriptionPrice(Plan $plan): int
    {
        return $plan->price_cents;
    }

    /**
     * Get the fixed platform price for forking a trip plan.
     */
    public function calculateForkPrice(Trip $trip): int
    {
        // 50000 cents = 500 EGP as default fallback
        $price = Setting::where('key', 'trip_fork_price_cents')->value('value');

        return $price ? (int) $price : 50000;
    }

    /**
     * Calculate the total real-world checkout price for booking an entire Trip Package.
     * This includes all attachable entities that have an explicit numeric cost.
     */
    public function calculatePackagePrice(Trip $trip): int
    {
        $totalCents = 0;

        // Sum up Flights
        // Cast decimals to cents safely (e.g. 150.50 -> 15050)
        $trip->loadMissing(['flights', 'hotels']);

        foreach ($trip->flights as $flight) {
            if (isset($flight->price) && is_numeric($flight->price)) {
                $totalCents += (int) round($flight->price * 100);
            }
        }

        // Sum up Hotels (assuming 1 night for simplification if nights aren't specified on pivot)
        foreach ($trip->hotels as $hotel) {
            if (isset($hotel->price_per_night) && is_numeric($hotel->price_per_night)) {
                // Future improvement: check pivot for 'nights' or 'days'
                $nights = 1; // Defaulting to 1 for MVP
                $totalCents += (int) round($hotel->price_per_night * $nights * 100);
            }
        }

        // Add platform commission for physical bookings (e.g., 5%)
        // This could be fetched from Settings.
        $commissionRate = Setting::where('key', 'platform_booking_commission_rate')->value('value');
        $rate = $commissionRate !== null ? (float) $commissionRate : 0.05;

        $totalWithCommission = (int) round($totalCents * (1 + $rate));

        return $totalWithCommission;
    }
}
