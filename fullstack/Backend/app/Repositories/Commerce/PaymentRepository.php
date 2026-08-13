<?php

namespace App\Repositories\Commerce;

use App\Enums\PaymentStatus;
use App\Interfaces\Commerce\PaymentRepositoryInterface;
use App\Models\Commerce\Payment;

class PaymentRepository implements PaymentRepositoryInterface
{
    public function createPendingPayment(int $orderId, string $transactionId, int $amountCents, string $currency, ?string $clientSecret = null, ?string $checkoutUrl = null): Payment
    {
        return Payment::create([
            'order_id' => $orderId,
            'paymob_transaction_id' => $transactionId,
            'status' => PaymentStatus::PENDING,
            'amount_cents' => $amountCents,
            'currency' => $currency,
            'client_secret' => $clientSecret,
            'checkout_url' => $checkoutUrl,
            'hmac_valid' => false,
            'raw_payload' => [],
        ]);
    }

    public function findByTransactionId(string $transactionId): ?Payment
    {
        return Payment::where('paymob_transaction_id', $transactionId)->first();
    }

    public function updatePaymentStatus(Payment $payment, string $status, array $payload, ?string $cardType, ?string $cardSubType): bool
    {
        return $payment->update([
            'status' => $status,
            'hmac_valid' => true,
            'raw_payload' => $payload,
        ]);
    }
}
