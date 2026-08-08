<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Exception;

class AiUsageService
{
    /**
     * Atomically consumes one AI generation for a user.
     * Throws an exception if the user has exhausted their quota or lacks an active subscription.
     */
    public function consumeQuota(User $user): void
    {
        // 1. Check if the user has an active plan that gives quota
        $activeSub = $user->subscriptions()->where('status', 'active')->latest()->first();
        
        $monthlyLimit = 0;
        if ($activeSub && $activeSub->plan) {
            $monthlyLimit = $activeSub->plan->ai_quota_monthly;
        }

        // 2. Check if reset date has passed to reset count
        if ($user->ai_reset_at && $user->ai_reset_at->isPast()) {
            $user->forceFill([
                'ai_generations_count' => 0,
                'ai_reset_at' => now()->addMonth(),
            ])->save();
        }

        if ($monthlyLimit <= 0) {
            throw new Exception("You need an active subscription with an AI quota to generate itineraries.");
        }

        // 3. Atomically increment the usage counter to prevent race conditions
        $updated = DB::table('users')
            ->where('id', $user->id)
            ->where('ai_generations_count', '<', $monthlyLimit)
            ->update([
                'ai_generations_count' => DB::raw('ai_generations_count + 1')
            ]);

        if ($updated === 0) {
            throw new Exception("You have exhausted your monthly AI quota. Please upgrade your plan.");
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
                'ai_generations_count' => DB::raw('ai_generations_count - 1')
            ]);
    }
}
