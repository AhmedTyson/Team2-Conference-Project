<?php

namespace App\Strategies\Checkout;

use App\Models\System\Setting;
use App\Models\Trips\Trip;
use Illuminate\Database\Eloquent\Model;

class TripPackageStrategy implements CheckoutStrategyInterface
{
    public function resolveProduct(int $productId): Model
    {
        return Trip::findOrFail($productId);
    }

    public function calculatePrice(Model $product): int
    {
        /** @var Trip $product */
        $totalCents = 0;

        $product->loadMissing(['flights', 'hotels', 'restaurants']);

        foreach ($product->flights as $flight) {
            if (isset($flight->price) && is_numeric($flight->price)) {
                $totalCents += (int) round($flight->price * 100);
            }
        }

        foreach ($product->hotels as $hotel) {
            if (isset($hotel->price_per_night) && is_numeric($hotel->price_per_night)) {
                $nights = 1; // Defaulting to 1 for MVP
                $totalCents += (int) round($hotel->price_per_night * $nights * 100);
            }
        }

        foreach ($product->restaurants as $restaurant) {
            if (isset($restaurant->price_cents) && is_numeric($restaurant->price_cents)) {
                $totalCents += (int) $restaurant->price_cents;
            }
        }

        // Leave Attractions out for now — no price field exists and no scope was given to add one.
        // Attractions remain unpriced.

        if ($totalCents <= 0 && isset($product->budget) && is_numeric($product->budget) && $product->budget > 0) {
            $totalCents = (int) round($product->budget * 100);
        }

        if ($totalCents <= 0) {
            $totalCents = 150000; // Default baseline package fallback (1500.00 EGP/USD)
        }

        $commissionRate = Setting::where('key', 'platform_booking_commission_rate')->value('value');
        $rate = $commissionRate !== null ? (float) $commissionRate : 0.05;

        return (int) round($totalCents * (1 + $rate));
    }

    public function getPurchaseType(): string
    {
        return 'trip_package';
    }
}
