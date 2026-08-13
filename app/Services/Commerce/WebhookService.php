<?php

namespace App\Services\Commerce;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\PaymentFailed;
use App\Events\PaymentSucceeded;
use App\Interfaces\Commerce\OrderRepositoryInterface;
use App\Interfaces\Commerce\PaymentGatewayInterface;
use App\Interfaces\Commerce\PaymentRepositoryInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WebhookService
{
    public function __construct(
        protected PaymentGatewayInterface $paymentGateway,
        protected PaymentRepositoryInterface $paymentRepository,
        protected OrderRepositoryInterface $orderRepository
    ) {}

    public function processWebhook(array $payload, ?string $hmacSignature): array
    {
        if (! $this->paymentGateway->verifyWebhook($payload, $hmacSignature)) {
            Log::warning('Paymob webhook HMAC validation failed');

            return ['success' => false, 'message' => 'Invalid HMAC'];
        }

        $obj = $payload['obj'] ?? null;
        if (! $obj) {
            return ['success' => false, 'message' => 'Invalid payload'];
        }

        $merchantOrderId = $obj['order']['merchant_order_id'] ?? null;

        if (! $merchantOrderId) {
            return ['success' => false, 'message' => 'Missing merchant_order_id'];
        }

        $lock = Cache::lock("paymob_webhook_processing_{$merchantOrderId}", 60);

        if (! $lock->get()) {
            return ['success' => true, 'message' => 'Already processing'];
        }

        try {
            $payment = $this->paymentRepository->findByTransactionId($merchantOrderId);

            if (! $payment) {
                return ['success' => false, 'message' => 'Payment not found'];
            }

            if (in_array($payment->status, [PaymentStatus::PAID, PaymentStatus::FAILED])) {
                return ['success' => true, 'message' => 'Already processed'];
            }

            $success = filter_var($obj['success'] ?? false, FILTER_VALIDATE_BOOLEAN);

            // D5: a success webhook may only fulfill an order within the
            // 24-hour grace period. After that the payment is accepted at the
            // gateway but never fulfilled — no entitlements may be granted.
            $order = $payment->order;
            $graceDeadline = $order?->created_at?->copy()->addHours(24);

            if ($success && $order && $graceDeadline && now()->greaterThan($graceDeadline)) {
                Log::warning('Paymob payment webhook arrived after the 24-hour grace period; order will not be fulfilled', [
                    'order_id' => $order->id,
                    'payment_id' => $payment->id,
                    'order_age_hours' => round(now()->diffInHours($order->created_at), 2),
                ]);

                return ['success' => false, 'message' => 'Order expired beyond grace period'];
            }

            $cardType = $obj['source_data']['type'] ?? null;
            $cardSubType = $obj['source_data']['sub_type'] ?? null;

            if ($success) {
                DB::transaction(function () use ($payment, $payload, $cardType, $cardSubType) {
                    $this->paymentRepository->updatePaymentStatus($payment, PaymentStatus::PAID->value, $payload, $cardType, $cardSubType);

                    if ($payment->order) {
                        $this->orderRepository->updateStatus($payment->order, OrderStatus::PAID->value);
                    }
                });

                event(new PaymentSucceeded($payment));
            } else {
                DB::transaction(function () use ($payment, $payload, $cardType, $cardSubType) {
                    $this->paymentRepository->updatePaymentStatus($payment, PaymentStatus::FAILED->value, $payload, $cardType, $cardSubType);

                    if ($payment->order) {
                        $this->orderRepository->updateStatus($payment->order, OrderStatus::FAILED->value);
                    }
                });

                event(new PaymentFailed($payment));
            }

            return ['success' => true, 'message' => 'Processed'];

        } finally {
            $lock->release();
        }
    }
}
