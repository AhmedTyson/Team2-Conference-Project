<?php

namespace App\Listeners;

use App\Enums\OrderStatus;
use App\Enums\SubscriptionStatus;
use App\Events\PaymentSucceeded;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Trip;
use App\Models\User;
use App\Notifications\PaymentSucceededNotification;
use App\Notifications\SubscriptionActivatedNotification;
use App\Services\TripForkService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Carbon;

class FulfillOrderListener implements ShouldQueue
{
    public function handle(PaymentSucceeded $event): void
    {
        $payment = $event->payment;
        $order = $payment->order;

        if (!$order || $order->status !== OrderStatus::PAID) {
            return;
        }

        foreach ($order->items as $item) {
            $metadata = $item->metadata ?? [];
            $purchaseType = $metadata['purchase_type'] ?? null;

            if ($item->product_type === Plan::class || $item->product_type === 'plan' || $purchaseType === 'subscription') {
                $this->fulfillSubscription($order->user_id, $item->product_id, $payment);
            } elseif (($item->product_type === Trip::class || $item->product_type === 'trip') && $purchaseType === 'trip_fork') {
                $this->fulfillTripFork($order->user_id, $item->product_id);
            }
        }

        $order->update(['status' => OrderStatus::FULFILLED]);

        // Send Notification
        if ($order->user) {
            $order->user->notify(new PaymentSucceededNotification($order));
        }
    }

    protected function fulfillTripFork(int $userId, int $sourceTripId): void
    {
        $tripForkService = app(TripForkService::class);
        $tripForkService->fulfillFork($userId, $sourceTripId);
    }

    protected function fulfillSubscription(int $userId, int $planId, $payment): void
    {
        $plan = Plan::find($planId);
        if (!$plan) return;

        $user = User::find($userId);

        // Terminate any existing active subscriptions to prevent overlaps
        Subscription::where('user_id', $userId)
            ->where('status', SubscriptionStatus::ACTIVE)
            ->update(['status' => SubscriptionStatus::CANCELLED]);

        $subscription = Subscription::create([
            'user_id' => $userId,
            'plan_id' => $planId,
            'status' => SubscriptionStatus::ACTIVE,
            'price_cents' => $plan->price_cents,
            'currency' => $plan->currency,
            'started_at' => now(),
            'renews_at' => $plan->billing_cycle === 'yearly' ? now()->addYear() : now()->addMonth(),
            'provider' => 'paymob',
            'provider_ref' => $payment->paymob_transaction_id,
        ]);

        // Apply AI Quota (Reset count to 0, extend validity)
        $user->forceFill([
            'ai_generations_count' => 0,
            'ai_reset_at' => now()->addMonth(),
        ])->save();

        $user->notify(new SubscriptionActivatedNotification($subscription));
    }
}
