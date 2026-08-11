<?php

namespace App\Repositories\Commerce;

use App\Enums\OrderStatus;
use App\Interfaces\Commerce\OrderRepositoryInterface;
use App\Models\Commerce\Order;
use App\Models\Commerce\OrderItem;

class OrderRepository implements OrderRepositoryInterface
{
    public function createOrder(int $userId, int $totalCents, string $currency, ?string $idempotencyKey = null): Order
    {
        return Order::create([
            'user_id' => $userId,
            'status' => OrderStatus::PENDING,
            'idempotency_key' => $idempotencyKey,
            'total_cents' => $totalCents,
            'currency' => $currency,
            // D5: normal pending-payment window is 30 minutes.
            'expires_at' => now()->addMinutes(30),
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
