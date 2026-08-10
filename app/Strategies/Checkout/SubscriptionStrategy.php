<?php

namespace App\Strategies\Checkout;

use App\Models\Commerce\Plan;
use Illuminate\Database\Eloquent\Model;

class SubscriptionStrategy implements CheckoutStrategyInterface
{
    public function resolveProduct(int $productId): Model
    {
        return Plan::findOrFail($productId);
    }

    public function calculatePrice(Model $product): int
    {
        /** @var Plan $product */
        return $product->price_cents;
    }

    public function getPurchaseType(): string
    {
        return 'subscription';
    }
}
