<?php

namespace App\Repositories;

use App\Enums\OrderStatus;
use App\Interfaces\OrderRepositoryInterface;
use App\Models\Order;
use App\Models\OrderItem;

class OrderRepository implements OrderRepositoryInterface
{
    public function createOrder(int $userId, int $totalCents, string $currency): Order
    {
        return Order::create([
            'user_id' => $userId,
            'status' => OrderStatus::PENDING,
            'total_cents' => $totalCents,
            'currency' => $currency,
        ]);
    }

    public function createOrderItem(Order $order, $product, int $priceCents, array $metadata): void
    {
        $orderItem = new OrderItem([
            'price_cents' => $priceCents,
            'metadata' => $metadata,
        ]);
        $orderItem->product()->associate($product);
        $order->items()->save($orderItem);
    }

    public function updateStatus(Order $order, string $status): bool
    {
        return $order->update(['status' => $status]);
    }
}
