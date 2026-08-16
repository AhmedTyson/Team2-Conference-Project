<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Interfaces\Commerce\PaymentGatewayInterface;
use App\Services\Commerce\WebhookService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymobWebhookController extends Controller
{
    public function __construct(
        protected WebhookService $webhookService,
        protected PaymentGatewayInterface $paymentGateway
    ) {}

    public function handle(Request $request)
    {
        $payload = $request->all();
        $hmacSignature = $request->query('hmac');

        $result = $this->webhookService->processWebhook($payload, $hmacSignature);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'] ?? '',
        ], 200);
    }

    public function callback(Request $request)
    {
        $success = $request->boolean('success')
            || $request->input('success') === 'true'
            || $request->input('txn_response_code') === 'APPROVED'
            || ($request->has('error_occured') && $request->input('error_occured') === 'false');

        $merchantOrderId = $request->query('merchant_order_id') ?: $request->query('order');
        $id = $request->query('id') ?: $request->query('transaction_id');
        $amountCents = $request->query('amount_cents') ?: $request->query('amount_cents_int');
        $currency = $request->query('currency', 'EGP');
        $pan = $request->query('source_data_pan') ?: $request->query('source_data.pan', '****');
        $cardType = $request->query('source_data_sub_type') ?: $request->query('source_data.sub_type', 'Card');
        $createdAt = $request->query('created_at', now()->toIso8601String());

        if ($request->wantsJson() && $request->header('Accept') === 'application/json') {
            return ApiResponse::success([
                'reference' => $merchantOrderId,
                'transaction_id' => $id,
                'success' => $success,
                'amount_cents' => $amountCents,
                'currency' => $currency,
            ], $success ? 'Payment successful' : 'Payment failed');
        }

        $redirectParams = http_build_query([
            'order_id' => $merchantOrderId ?? '',
            'id' => $id ?? '',
            'success' => $success ? 'true' : 'false',
            'amount_cents' => $amountCents ?? '',
            'currency' => $currency,
            'pan' => $pan,
            'card_type' => $cardType,
            'created_at' => $createdAt,
            'txn_response_code' => $request->query('txn_response_code', $success ? 'APPROVED' : 'FAILED'),
        ]);

        return redirect('/app/payment-success.html?' . $redirectParams);
    }
}
