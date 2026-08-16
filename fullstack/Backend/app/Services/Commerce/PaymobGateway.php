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
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:8080');

        if (empty($this->secretKey) || str_starts_with($this->secretKey, 'mock') || app()->environment('testing')) {
            $simulatedCheckoutUrl = url('/api/v1/paymob/callback?') . http_build_query([
                'merchant_order_id' => $referenceId,
                'success' => 'true',
                'id' => '516' . rand(100000, 999999),
                'txn_response_code' => 'APPROVED',
                'source_data_pan' => '1111',
                'source_data_sub_type' => 'Visa',
            ]);

            return [
                'success' => true,
                'client_secret' => 'simulated_cs_' . uniqid(),
                'checkout_url' => $simulatedCheckoutUrl,
                'message' => 'Simulated test checkout created',
            ];
        }

        try {
            // Paymob requires strings and all mandatory billing fields:
            // first_name, last_name, email, phone_number, building, floor, apartment, street, city, state, country, postal_code
            $formattedBilling = [
                'first_name' => (string) (!empty($billingData['first_name']) ? $billingData['first_name'] : 'Traveler'),
                'last_name' => (string) (!empty($billingData['last_name']) ? $billingData['last_name'] : 'User'),
                'email' => (string) (!empty($billingData['email']) ? $billingData['email'] : 'traveler@example.com'),
                'phone_number' => (string) (!empty($billingData['phone_number']) && $billingData['phone_number'] !== 'NA' ? $billingData['phone_number'] : '+201000000000'),
                'apartment' => (string) (!empty($billingData['apartment']) ? $billingData['apartment'] : '1'),
                'floor' => (string) (!empty($billingData['floor']) ? $billingData['floor'] : '1'),
                'building' => (string) (!empty($billingData['building']) ? $billingData['building'] : '1'),
                'street' => (string) (!empty($billingData['street']) ? $billingData['street'] : 'Main St'),
                'city' => (string) (!empty($billingData['city']) ? $billingData['city'] : 'Cairo'),
                'state' => (string) (!empty($billingData['state']) ? $billingData['state'] : 'Cairo'),
                'country' => (string) (!empty($billingData['country']) ? $billingData['country'] : 'EG'),
                'postal_code' => (string) (!empty($billingData['postal_code']) ? $billingData['postal_code'] : '11511'),
                'shipping_method' => 'PKG',
            ];

            $data = [
                'amount' => $amountCents,
                'currency' => $currency,
                'payment_methods' => $this->integrationIds,
                'billing_data' => $formattedBilling,
                'customer' => [
                    'first_name' => $formattedBilling['first_name'],
                    'last_name' => $formattedBilling['last_name'],
                    'email' => $formattedBilling['email'],
                ],
                'extras' => ['merchant_intention_id' => $referenceId],
                'special_reference' => $referenceId,
                'notify_url' => url('/api/paymob/webhook'),
                'return_url' => url('/api/paymob/callback'),
            ];

            $paymobReq = $this->makeClient();
            $status = $paymobReq->createIntention($this->secretKey, $data, $referenceId);

            if (! $status['success']) {
                Log::error('Paymob Intention Failed', ['response' => $status]);

                $errMsg = !empty($status['message']) ? $status['message'] : (is_array($status) ? json_encode($status) : 'Paymob API Intention failed. Check PAYMOB_SECRET_KEY in .env');

                return [
                    'success' => false,
                    'message' => $errMsg,
                ];
            }

            $countryCode = $paymobReq->getCountryCode($this->secretKey);
            $apiUrl = $paymobReq->getApiUrl($countryCode);
            $clientSecret = $status['cs'] ?? ('simulated_cs_' . md5($referenceId));

            return [
                'success' => true,
                'client_secret' => $clientSecret,
                'checkout_url' => $apiUrl."unifiedcheckout/?publicKey={$this->publicKey}&clientSecret={$clientSecret}",
                'message' => 'Intention created successfully',
            ];

        } catch (\Throwable $e) {
            Log::error('Paymob Exception', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'message' => 'Payment gateway error: ' . $e->getMessage(),
            ];
        }
    }

    public function verifyWebhook(array $payload, ?string $hmacSignature = null): bool
    {
        if (empty($this->hmac) || app()->environment('testing', 'local')) {
            return true;
        }

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
