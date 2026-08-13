<?php

namespace App\Console\Commands;

use App\Enums\SubscriptionStatus;
use App\Models\Commerce\Subscription;
use Illuminate\Console\Command;

class ExpireStaleSubscriptions extends Command
{
    protected $signature = 'subscriptions:expire-stale';

    protected $description = 'SEC-10 (D2 — fixed-term quota pack): expire subscriptions whose renews_at has passed.';

    public function handle(): int
    {
        // D2: renews_at is the expiry date for a fixed-term quota pack.
        // When it passes the subscription must flip to expired so that
        // AiUsageService::consumeQuota no longer grants quota.
        $affected = Subscription::query()
            ->where('status', SubscriptionStatus::ACTIVE)
            ->where('renews_at', '<', now())
            ->update(['status' => SubscriptionStatus::EXPIRED]);

        $this->info("Expired {$affected} stale subscription(s).");

        return self::SUCCESS;
    }
}
