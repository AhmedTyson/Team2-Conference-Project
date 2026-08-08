<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\WebhookService;
use App\Interfaces\PaymentGatewayInterface;

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
            'message' => $result['message'] ?? ''
        ], $result['status'] ?? 200);
    }

    public function callback(Request $request)
    {
        $success = $request->boolean('success');
        $merchantOrderId = $request->query('merchant_order_id');

        if (!$this->paymentGateway->verifyWebhook($request->all(), null)) {
            return response()->json(['success' => false, 'message' => 'Invalid HMAC signature'], 403);
        }

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Payment successful' : 'Payment failed',
            'reference' => $merchantOrderId,
        ]);
    }
}
