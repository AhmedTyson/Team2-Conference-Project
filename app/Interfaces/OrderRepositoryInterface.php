<?php

namespace App\Interfaces;

use App\Models\Order;

interface OrderRepositoryInterface
{
    public function createOrder(int $userId, int $totalCents, string $currency): Order;
    public function createOrderItem(Order $order, $product, int $priceCents, array $metadata): void;
    public function updateStatus(Order $order, string $status): bool;
}
