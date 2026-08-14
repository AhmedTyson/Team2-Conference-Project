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
        $success = $request->boolean('success') || $request->input('success') === 'true';
        $merchantOrderId = $request->query('merchant_order_id');
        $id = $request->query('id');

        $isValid = $this->paymentGateway->verifyWebhook($request->all(), $request->query('hmac'));

        if (! $isValid) {
            if ($request->wantsJson()) {
                return ApiResponse::fail('Invalid HMAC signature', 'invalid_hmac', 403);
            }
            return redirect('/app/receipt.html?success=false&error=invalid_hmac');
        }

        if ($request->wantsJson()) {
            return ApiResponse::success([
                'reference' => $merchantOrderId,
                'transaction_id' => $id,
                'success' => $success,
            ], $success ? 'Payment successful' : 'Payment failed');
        }

        return redirect('/app/receipt.html?order_id=' . urlencode($merchantOrderId ?? '') . '&id=' . urlencode($id ?? '') . '&success=' . ($success ? 'true' : 'false'));
    }
}
