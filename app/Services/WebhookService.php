<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\PaymentFailed;
use App\Events\PaymentSucceeded;
use App\Interfaces\OrderRepositoryInterface;
use App\Interfaces\PaymentGatewayInterface;
use App\Interfaces\PaymentRepositoryInterface;
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

            return ['success' => false, 'message' => 'Invalid HMAC', 'status' => 403];
        }

        $obj = $payload['obj'] ?? null;
        if (! $obj) {
            return ['success' => false, 'message' => 'Invalid payload', 'status' => 400];
        }

        $merchantOrderId = $obj['order']['merchant_order_id'] ?? null;

        if (! $merchantOrderId) {
            return ['success' => false, 'message' => 'Missing merchant_order_id', 'status' => 400];
        }

        $lock = Cache::lock("paymob_webhook_processing_{$merchantOrderId}", 15);

        if (! $lock->get()) {
            return ['success' => true, 'message' => 'Already processing', 'status' => 200];
        }

        try {
            $payment = $this->paymentRepository->findByTransactionId($merchantOrderId);

            if (! $payment) {
                return ['success' => false, 'message' => 'Payment not found', 'status' => 404];
            }

            if (in_array($payment->status, [PaymentStatus::PAID, PaymentStatus::FAILED])) {
                return ['success' => true, 'message' => 'Already processed', 'status' => 200];
            }

            $success = filter_var($obj['success'] ?? false, FILTER_VALIDATE_BOOLEAN);

            $cardType = $obj['source_data']['type'] ?? null;
            $cardSubType = $obj['source_data']['sub_type'] ?? null;
            $cardPan = $obj['source_data']['pan'] ?? null;

            if ($success) {
                DB::transaction(function () use ($payment, $payload, $cardType, $cardSubType, $cardPan) {
                    $this->paymentRepository->updatePaymentStatus($payment, PaymentStatus::PAID->value, $payload, $cardType, $cardSubType, $cardPan);

                    if ($payment->order) {
                        $this->orderRepository->updateStatus($payment->order, OrderStatus::PAID->value);
                    }
                });

                event(new PaymentSucceeded($payment));
            } else {
                DB::transaction(function () use ($payment, $payload, $cardType, $cardSubType, $cardPan) {
                    $this->paymentRepository->updatePaymentStatus($payment, PaymentStatus::FAILED->value, $payload, $cardType, $cardSubType, $cardPan);

                    if ($payment->order) {
                        $this->orderRepository->updateStatus($payment->order, OrderStatus::FAILED->value);
                    }
                });

                event(new PaymentFailed($payment));
            }

            return ['success' => true, 'message' => 'Processed', 'status' => 200];

        } finally {
            $lock->release();
        }
    }
}
