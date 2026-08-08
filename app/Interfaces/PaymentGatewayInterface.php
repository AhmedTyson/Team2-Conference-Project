<?php

namespace App\Interfaces;

interface PaymentGatewayInterface
{
    /**
     * Create a payment intention/session with the gateway.
     *
     * @param string $referenceId The internal Order or Booking ID/reference.
     * @param int $amountCents The total amount in minor units (cents, piastres).
     * @param string $currency The 3-letter currency code (e.g., EGP).
     * @param array $billingData Associative array with user billing info.
     * @return array Contains 'success', 'client_secret', 'checkout_url', 'transaction_id', 'message'
     */
    public function createIntention(string $referenceId, int $amountCents, string $currency, array $billingData): array;

    /**
     * Verify the authenticity of a webhook request using HMAC.
     *
     * @param array $payload The request payload/parameters.
     * @param string|null $hmacSignature The provided signature (if applicable).
     * @return bool
     */
    public function verifyWebhook(array $payload, ?string $hmacSignature = null): bool;
}
