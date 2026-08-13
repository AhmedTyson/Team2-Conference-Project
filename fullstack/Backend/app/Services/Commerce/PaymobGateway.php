<?php

namespace App\Services\Commerce;

use App\Interfaces\Commerce\PaymentGatewayInterface;
use Exception;
use Illuminate\Support\Facades\Log;
use Paymob\Library\Paymob;

class PaymobGateway implements PaymentGatewayInterface
{
    protected string $secretKey;

    protected string $publicKey;

    protected array $integrationIds;

    protected string $hmac;

    public function __construct()
    {
        $this->secretKey = config('paymob.secret_key', '');
        $this->publicKey = config('paymob.public_key', '');
        $this->hmac = config('paymob.hmac', '');

        // SEC-05: in production an empty HMAC secret makes webhook verification
        // trivially forgeable (HMAC computed with empty key) and silently grants
        // free fulfillment. Fail fast instead of accepting payments.
        if ($this->hmac === '' && app()->environment('production')) {
            throw new Exception('PAYMOB_HMAC is not configured for production.');
        }

        $integrationString = config('paymob.integration_ids', '');
        $this->integrationIds = array_filter(array_map('intval', explode(',', $integrationString)));
    }

    /**
     * Build a PaymobClient with bounded cURL timeouts.
     *
     * The SDK (paymob/php-library v1.0.4) sets no CURLOPT_TIMEOUT or
     * CURLOPT_CONNECTTIMEOUT. PaymobClient overrides HttpRequest() to
     * inject these. Values are driven by config so they can be tuned
     * per environment without code changes.
     */
    protected function makeClient(): PaymobClient
    {
        return new PaymobClient(
            timeoutSeconds: (int) config('paymob.timeout', 30),
            connectTimeoutSeconds: (int) config('paymob.connect_timeout', 5),
        );
    }

    public function createIntention(string $referenceId, int $amountCents, string $currency, array $billingData): array
    {
        try {
            // Paymob requires strings and specific fields.
            // Format billing data falling back to 'NA' if missing
            $formattedBilling = [
                'email' => $billingData['email'] ?? 'na@example.com',
                'first_name' => $billingData['first_name'] ?? 'NA',
                'last_name' => $billingData['last_name'] ?? 'NA',
                'street' => $billingData['street'] ?? 'NA',
                'phone_number' => $billingData['phone_number'] ?? 'NA',
                'city' => $billingData['city'] ?? 'NA',
                'country' => $billingData['country'] ?? 'NA',
                'state' => $billingData['state'] ?? 'NA',
                'postal_code' => $billingData['postal_code'] ?? 'NA',
            ];

            // In Paymob Unified Checkout, the amount in payload must match their expected format.
            // Based on the stub, `amount` field for the SDK expects actual decimal amount,
            // and it multiplies by cents internally depending on country.
            // Wait, looking at the previous controller:
            // $price = 10; $cents = 100; $price = round(round($price, 2) * $cents, 2);
            // So if amount is 10 EGP, it passes 1000.
            // Since we ALREADY have `amountCents` (e.g. 1000), we just pass it.

            $data = [
                'amount' => $amountCents,
                'currency' => $currency,
                'payment_methods' => $this->integrationIds,
                'billing_data' => $formattedBilling,
                'extras' => ['merchant_intention_id' => $referenceId],
                'special_reference' => $referenceId,
                'notify_url' => route('paymob-v1.webhook'),
                'return_url' => route('paymob-v1.callback'), // for frontend redirect
            ];

            $paymobReq = $this->makeClient();
            $status = $paymobReq->createIntention($this->secretKey, $data, $referenceId);

            if (! $status['success']) {
                Log::error('Paymob Intention Failed', ['response' => $status]);

                return [
                    'success' => false,
                    'message' => $status['message'] ?? 'Payment gateway error',
                ];
            }

            $countryCode = $paymobReq->getCountryCode($this->secretKey);
            $apiUrl = $paymobReq->getApiUrl($countryCode);
            $clientSecret = $status['cs'];

            return [
                'success' => true,
                'client_secret' => $clientSecret,
                'checkout_url' => $apiUrl."unifiedcheckout/?publicKey={$this->publicKey}&clientSecret={$clientSecret}",
                // Paymob SDK does not return the numeric transaction ID immediately in intention response natively
                // unless we parse it. We'll rely on webhooks to receive it.
                'message' => 'Intention created successfully',
            ];

        } catch (Exception $e) {
            Log::error('Paymob Exception', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'message' => 'Payment gateway error',
            ];
        }
    }

    public function verifyWebhook(array $payload, ?string $hmacSignature = null): bool
    {
        // For GET Callbacks
        if (isset($payload['hmac']) && ! $hmacSignature) {
            return Paymob::verifyHmac($this->hmac, $payload);
        }

        // For POST Webhooks
        if ($hmacSignature && isset($payload['obj'])) {
            return Paymob::verifyAcceptHmac($this->hmac, $payload, $hmacSignature);
        }

        return false;
    }
}
