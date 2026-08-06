<?php

namespace App\Services;

use App\Interfaces\PlanRepositoryInterface;
use App\Models\Subscription;
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

    public function setPlans(array $plans)
    {
        return $this->planRepository->upsertPlans($plans);
    }

    public function subscribe(int $userId, int $planId): Subscription
    {
        if ($this->planRepository->getActiveSubscription($userId)) {
            abort(422, 'User already has an active subscription. Upgrade or cancel first.');
        }

        $plan = $this->planRepository->findPlan($planId);

        $subscription = Subscription::create([
            'user_id' => $userId,
            'plan_id' => $plan->id,
            'status' => 'active',
            'price_cents' => $plan->price_cents,
            'currency' => $plan->currency,
            'started_at' => now(),
            'renews_at' => $this->nextRenewal($plan->billing_cycle),
            'provider' => null,
            'provider_ref' => null,
        ]);

        $this->syncAiQuota($userId, $plan->ai_quota_monthly);

        return $subscription;
    }

    public function upgrade(int $userId, int $planId): array
    {
        $subscription = $this->planRepository->getActiveSubscription($userId);

        if (!$subscription) {
            abort(422, 'No active subscription to upgrade.');
        }

        $plan = $this->planRepository->findPlan($planId);

        if ($plan->id === $subscription->plan_id) {
            abort(422, 'User is already subscribed to this plan.');
        }

        $remainingDays = $subscription->renews_at
            ? max(0, (int) $subscription->renews_at->diffInDays(now()))
            : 0;
        $cycleDays = $remainingDays > 0 && $subscription->renews_at
            ? max(1, (int) $subscription->renews_at->diffInDays($subscription->started_at))
            : 1;
        $unusedCreditCents = (int) round($subscription->price_cents * ($remainingDays / $cycleDays));
        $proratedChargeCents = max(0, $plan->price_cents - $unusedCreditCents);

        $subscription->update([
            'plan_id' => $plan->id,
            'price_cents' => $plan->price_cents,
            'currency' => $plan->currency,
            'renews_at' => $this->nextRenewal($plan->billing_cycle),
            'provider' => null,
            'provider_ref' => null,
        ]);

        $this->syncAiQuota($userId, $plan->ai_quota_monthly);

        return [
            'subscription' => $subscription,
            'unused_credit_cents' => $unusedCreditCents,
            'prorated_charge_cents' => $proratedChargeCents,
            'note' => 'PSP charge (Paymob) wiring lands with payment task — no charge executed yet.',
        ];
    }

    public function cancel(int $userId): Subscription
    {
        $subscription = $this->planRepository->getActiveSubscription($userId);

        if (!$subscription) {
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
        $user = \App\Models\User::findOrFail($userId);
        $user->forceFill([
            'ai_generations_count' => 0,
            'ai_reset_at' => now()->addMonth(),
        ])->save();
    }
}
