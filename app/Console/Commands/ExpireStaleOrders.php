<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Models\Commerce\Order;
use Illuminate\Console\Command;

class ExpireStaleOrders extends Command
{
    protected $signature = 'orders:expire-stale';

    protected $description = 'Mark pending orders that exceeded their 30-minute checkout window as expired (audit history is preserved).';

    public function handle(): int
    {
        $affected = Order::query()
            ->where('status', OrderStatus::PENDING)
            ->where('expires_at', '<', now())
            ->update(['status' => OrderStatus::EXPIRED]);

        $this->info("Expired {$affected} stale order(s).");

        return self::SUCCESS;
    }
}
