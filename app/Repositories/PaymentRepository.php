<?php

namespace App\Repositories;

use App\Interfaces\PaymentRepositoryInterface;
use App\Models\Payment;
use App\Enums\PaymentStatus;

class PaymentRepository implements PaymentRepositoryInterface
{
    public function createPendingPayment(int $orderId, string $transactionId, int $amountCents, string $currency): Payment
    {
        return Payment::create([
            'order_id' => $orderId,
            'booking_id' => null,
            'paymob_transaction_id' => $transactionId,
            'status' => PaymentStatus::PENDING,
            'amount_cents' => $amountCents,
            'currency' => $currency,
            'hmac_valid' => false,
            'raw_payload' => [],
        ]);
    }

    public function findByTransactionId(string $transactionId): ?Payment
    {
        return Payment::where('paymob_transaction_id', $transactionId)->first();
    }

    public function updatePaymentStatus(Payment $payment, string $status, array $payload, ?string $cardType, ?string $cardSubType, ?string $cardPan): bool
    {
        return $payment->update([
            'status' => $status,
            'hmac_valid' => true,
            'raw_payload' => $payload,
            'card_type' => $cardType,
            'card_subtype' => $cardSubType,
            'card_pan' => $cardPan,
        ]);
    }
}
