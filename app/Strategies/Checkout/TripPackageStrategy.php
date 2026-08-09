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

        $product->loadMissing(['flights', 'hotels']);

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

        $commissionRate = Setting::where('key', 'platform_booking_commission_rate')->value('value');
        $rate = $commissionRate !== null ? (float) $commissionRate : 0.05;

        return (int) round($totalCents * (1 + $rate));
    }

    public function getPurchaseType(): string
    {
        return 'trip_package';
    }
}
