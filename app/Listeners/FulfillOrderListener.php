<?php

namespace App\Listeners;

use App\Enums\OrderStatus;
use App\Enums\SubscriptionStatus;
use App\Events\PaymentSucceeded;
use App\Models\Account\User;
use App\Models\Commerce\Plan;
use App\Models\Commerce\Subscription;
use App\Models\Trips\Trip;
use App\Notifications\PaymentFailedNotification;
use App\Notifications\PaymentSucceededNotification;
use App\Notifications\SubscriptionActivatedNotification;
use App\Notifications\TripBookedNotification;
use App\Enums\TripStatus;
use App\Services\Trips\TripForkService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FulfillOrderListener implements ShouldQueue
{
    public function handle(PaymentSucceeded $event): void
    {
        $payment = $event->payment;
        $order = $payment->order;

        if (! $order || $order->status !== OrderStatus::PAID) {
            return;
        }

        try {
            DB::transaction(function () use ($order, $payment) {
                foreach ($order->items as $item) {
                    $metadata = $item->metadata ?? [];
                    $purchaseType = $metadata['purchase_type'] ?? null;

                    if ($item->product_type === Plan::class || $item->product_type === 'plan' || $purchaseType === 'subscription') {
                        $this->fulfillSubscription($order->user_id, $item->product_id, $payment);
                    } elseif (($item->product_type === Trip::class || $item->product_type === 'trip') && $purchaseType === 'trip_fork') {
                        $this->fulfillTripFork($order->user_id, $item->product_id);
                    } elseif (($item->product_type === Trip::class || $item->product_type === 'trip') && $purchaseType === 'trip_package') {
                        $this->fulfillTripPackage($order->user_id, $item->product_id);
                    }
                }

                $order->update(['status' => OrderStatus::FULFILLED]);
            });
        } catch (\Throwable $e) {
            Log::error('Order fulfillment failed', [
                'order_id' => $order->id,
                'payment_id' => $payment->id,
                'exception' => $e->getMessage(),
            ]);

            // Roll the order back to a visible failure state instead of leaving
            // a phantom "paid but never delivered" order. Any DB work already
            // done inside the transaction above was rolled back.
            $order->update(['status' => OrderStatus::FAILED]);

            if ($order->user) {
                $order->user->notify(new PaymentFailedNotification($order));
            }

            return;
        }

        // Send Notification
        if ($order->user) {
            $order->user->notify(new PaymentSucceededNotification($order));
        }
    }

    protected function fulfillTripPackage(int $userId, int $tripId): void
    {
        $trip = Trip::where('id', $tripId)->where('user_id', $userId)->first();
        if (! $trip) {
            return;
        }

        if (in_array($trip->status, [TripStatus::BOOKED, TripStatus::COMPLETED])) {
            return;
        }

        $trip->update(['status' => TripStatus::BOOKED]);
        
        $user = User::find($userId);
        if ($user) {
            $user->notify(new TripBookedNotification($trip));
        }
    }

    protected function fulfillTripFork(int $userId, int $sourceTripId): void
    {
        // Idempotency guard: a previous (partial) listener run may have already forked this trip.
        $alreadyForked = Trip::query()
            ->where('user_id', $userId)
            ->where('parent_trip_id', $sourceTripId)
            ->where('is_fork', true)
            ->exists();

        if ($alreadyForked) {
            return;
        }

        $tripForkService = app(TripForkService::class);
        $tripForkService->fulfillFork($userId, $sourceTripId);
    }

    protected function fulfillSubscription(int $userId, int $planId, $payment): void
    {
        $plan = Plan::find($planId);
        if (! $plan) {
            return;
        }

        $user = User::find($userId);

        // Idempotency guard: this payment already provisioned the subscription.
        if (Subscription::query()->where('provider_ref', $payment->paymob_transaction_id)->exists()) {
            return;
        }

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

