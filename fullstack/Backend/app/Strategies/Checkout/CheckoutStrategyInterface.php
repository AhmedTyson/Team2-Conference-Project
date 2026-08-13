<?php

namespace App\Strategies\Checkout;

use Illuminate\Database\Eloquent\Model;

interface CheckoutStrategyInterface
{
    /**
     * Resolve the product model from the database.
     */
    public function resolveProduct(int $productId): Model;

    /**
     * Calculate the final checkout price in minor units (cents).
     */
    public function calculatePrice(Model $product): int;

    /**
     * Get the string representation of the purchase type.
     */
    public function getPurchaseType(): string;
}
