<?php

namespace App\Services\Commerce;

use App\Interfaces\Commerce\PlanRepositoryInterface;
use App\Models\Account\User;
use App\Models\Commerce\Subscription;
use Illuminate\Support\Carbon;

class PlanService
{
    protected $planRepository;

    public function __construct(PlanRepositoryInterface $planRepository)
    {
        $this->planRepository = $planRepository;
    }

    public function getAllPlans()
    {
        return $this->planRepository->getAllPlans();
    }

    public function getPlan(int $id)
    {
        return $this->planRepository->findPlan($id);
    }

    public function setPlans(array $plans)
    {
        return $this->planRepository->upsertPlans($plans);
    }

    public function subscribe(int $userId, int $planId): Subscription
    {
        abort(400, 'Direct subscriptions are disabled. Please use the /api/checkout/initiate endpoint to purchase a subscription.');
    }

    public function upgrade(int $userId, int $planId): array
    {
        abort(400, 'Direct upgrades are disabled. Please use the /api/checkout/initiate endpoint to upgrade.');
    }

    public function cancel(int $userId): Subscription
    {
        $subscription = $this->planRepository->getActiveSubscription($userId);

        if (! $subscription) {
            abort(422, 'No active subscription to cancel.');
        }

        $subscription->update([
            'status' => 'cancelled',
            'renews_at' => null,
        ]);

        return $subscription;
    }

    public function subscription(int $userId): ?Subscription
    {
        $subscription = $this->planRepository->getLatestSubscription($userId);

        if ($subscription) {
            $subscription->load('plan');
        }

        return $subscription;
    }

    protected function nextRenewal(string $billingCycle): Carbon
    {
        return $billingCycle === 'yearly' ? now()->addYear() : now()->addMonth();
    }

    protected function syncAiQuota(int $userId, int $monthlyQuota): void
    {
        $user = User::findOrFail($userId);
        $user->forceFill([
            'ai_generations_count' => 0,
            'ai_reset_at' => now()->addMonth(),
        ])->save();
    }
}
