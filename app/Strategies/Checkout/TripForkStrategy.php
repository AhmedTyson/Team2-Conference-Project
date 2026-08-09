<?php

namespace App\Strategies\Checkout;

use App\Models\System\Setting;
use App\Models\Trips\Trip;
use Illuminate\Database\Eloquent\Model;

class TripForkStrategy implements CheckoutStrategyInterface
{
    public function resolveProduct(int $productId): Model
    {
        return Trip::findOrFail($productId);
    }

    public function calculatePrice(Model $product): int
    {
        /** @var Trip $product */
        // 50000 cents = 500 EGP as default fallback
        $price = Setting::where('key', 'trip_fork_price_cents')->value('value');

        return $price ? (int) $price : 50000;
    }

    public function getPurchaseType(): string
    {
        return 'trip_fork';
    }
}
