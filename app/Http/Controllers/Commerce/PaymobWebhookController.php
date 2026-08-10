<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Interfaces\Commerce\PaymentGatewayInterface;
use App\Services\Commerce\WebhookService;
use App\Support\ApiResponse;
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
        ], $result['status'] ?? 200);
    }

    public function callback(Request $request)
    {
        $success = $request->boolean('success');
        $merchantOrderId = $request->query('merchant_order_id');

        if (! $this->paymentGateway->verifyWebhook($request->all(), null)) {
            return ApiResponse::fail(
                'Invalid HMAC signature',
                'invalid_hmac',
                403
            );
        }

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Payment successful' : 'Payment failed',
            'reference' => $merchantOrderId,
        ]);
    }
}
