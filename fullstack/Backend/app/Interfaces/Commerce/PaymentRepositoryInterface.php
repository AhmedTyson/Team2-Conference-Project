<?php

namespace App\Interfaces\Commerce;

use App\Models\Commerce\Payment;

interface PaymentRepositoryInterface
{
    public function createPendingPayment(int $orderId, string $transactionId, int $amountCents, string $currency, ?string $clientSecret = null, ?string $checkoutUrl = null): Payment;

    public function findByTransactionId(string $transactionId): ?Payment;

    public function updatePaymentStatus(Payment $payment, string $status, array $payload, ?string $cardType, ?string $cardSubType): bool;
}
