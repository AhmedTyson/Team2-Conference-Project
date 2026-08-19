<?php

namespace App\Services\Trips;

use App\Models\Account\User;
use App\Services\Commerce\PlanService;
use Exception;
use Illuminate\Support\Facades\DB;

class AiUsageService
{
    public function __construct(protected readonly PlanService $planService) {}

    /**
     * Atomically consumes one AI generation for a user.
     * Throws an exception if the user has exhausted their quota or lacks an active subscription.
     */
    public function consumeQuota(User $user): void
    {
        // 1. Resolve the monthly limit from the active subscription plan (or the Free row for unsubscribed users).
        $hasSubscriptions = $user->subscriptions()->exists();
        $activeSub = $user->subscriptions()->where('status', 'active')->latest()->first();

        if ($hasSubscriptions && ! $activeSub) {
            throw new Exception('Your subscription has expired. Please renew your subscription to continue.');
        }

        $monthlyLimit = (int) $this->planService->resolveQuotaPlan($user)->ai_quota_monthly;

        if ($monthlyLimit <= 0) {
            throw new Exception('You need an active subscription with an AI quota to generate itineraries.');
        }

        // 2. Anchor the reset cycle on first use, then roll the counter when the cycle has elapsed.
        if (! $user->ai_reset_at) {
            $user->forceFill(['ai_reset_at' => now()->addMonth()])->save();
        } elseif ($user->ai_reset_at->isPast()) {
            $user->forceFill([
                'ai_generations_count' => 0,
                'ai_reset_at' => now()->addMonth(),
            ])->save();
        }

        // 3. Atomically increment the usage counter to prevent race conditions.
        $updated = DB::table('users')
            ->where('id', $user->id)
            ->where('ai_generations_count', '<', $monthlyLimit)
            ->update([
                'ai_generations_count' => DB::raw('ai_generations_count + 1'),
            ]);

        if ($updated === 0) {
            throw new Exception('You have exhausted your monthly AI quota. Please upgrade your plan.');
        }
    }

    /**
     * Restores one generation to the user's quota if an AI request fails.
     */
    public function restoreQuota(User $user): void
    {
        DB::table('users')
            ->where('id', $user->id)
            ->where('ai_generations_count', '>', 0)
            ->update([
                'ai_generations_count' => DB::raw('ai_generations_count - 1'),
            ]);
    }
}