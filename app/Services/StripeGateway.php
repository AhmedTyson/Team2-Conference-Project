<?php

namespace App\Services;

use App\Interfaces\PaymentGatewayInterface;
use Exception;
use Illuminate\Support\Facades\Log;

class StripeGateway implements PaymentGatewayInterface
{
    protected string $secretKey;

    public function __construct()
    {
        $this->secretKey = config('services.stripe.secret', '');
    }

    public function createIntention(string $referenceId, int $amountCents, string $currency, array $billingData): array
    {
        // Example implementation for Stripe
        try {
            // \Stripe\Stripe::setApiKey($this->secretKey);
            // $paymentIntent = \Stripe\PaymentIntent::create([...]);

            Log::info("Stripe Intention created for {$referenceId}");

            return [
                'success' => true,
                'client_secret' => 'pi_example_secret',
                'checkout_url' => 'https://checkout.stripe.com/pay/cs_test_example',
                'message' => 'Intention created successfully',
            ];
        } catch (Exception $e) {
            Log::error('Stripe Exception', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'message' => 'Payment gateway error: '.$e->getMessage(),
            ];
        }
    }

    public function verifyWebhook(array $payload, ?string $hmacSignature = null): bool
    {
        // Stripe webhook signature verification uses Stripe\Webhook::constructEvent()
        // Here we just return true for demonstration of the N-tier interface swap

        // Example:
        // $endpoint_secret = config('services.stripe.webhook_secret');
        // try {
        //     \Stripe\Webhook::constructEvent(json_encode($payload), $hmacSignature, $endpoint_secret);
        //     return true;
        // } catch(\UnexpectedValueException|\Stripe\Exception\SignatureVerificationException $e) {
        //     return false;
        // }

        return true;
    }
}
