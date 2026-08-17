<?php

namespace App\Http\Controllers\Commerce;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\PaymentFailed;
use App\Events\PaymentSucceeded;
use App\Http\Controllers\Controller;
use App\Interfaces\Commerce\OrderRepositoryInterface;
use App\Interfaces\Commerce\PaymentGatewayInterface;
use App\Interfaces\Commerce\PaymentRepositoryInterface;
use App\Services\Commerce\WebhookService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymobWebhookController extends Controller
{
    public function __construct(
        protected WebhookService $webhookService,
        protected PaymentGatewayInterface $paymentGateway,
        protected PaymentRepositoryInterface $paymentRepository,
        protected OrderRepositoryInterface $orderRepository
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

        // Process DB update & order fulfillment on callback if merchant_order_id exists
        if ($merchantOrderId) {
            $payment = $this->paymentRepository->findByTransactionId($merchantOrderId);

            if ($payment) {
                if ($success && $payment->status !== PaymentStatus::PAID) {
                    DB::transaction(function () use ($payment, $request, $cardType, $pan) {
                        $this->paymentRepository->updatePaymentStatus(
                            $payment,
                            PaymentStatus::PAID->value,
                            $request->all(),
                            $cardType,
                            $pan
                        );

                        if ($payment->order && $payment->order->status !== OrderStatus::PAID) {
                            $this->orderRepository->updateStatus($payment->order, OrderStatus::PAID->value);
                            event(new PaymentSucceeded($payment));
                        }
                    });
                } elseif (! $success && $payment->status === PaymentStatus::PENDING) {
                    DB::transaction(function () use ($payment, $request, $cardType, $pan) {
                        $this->paymentRepository->updatePaymentStatus(
                            $payment,
                            PaymentStatus::FAILED->value,
                            $request->all(),
                            $cardType,
                            $pan
                        );

                        if ($payment->order && $payment->order->status === OrderStatus::PENDING) {
                            $this->orderRepository->updateStatus($payment->order, OrderStatus::FAILED->value);
                            event(new PaymentFailed($payment));
                        }
                    });
                }
            }
        }

        if ($request->wantsJson() && $request->header('Accept') === 'application/json') {
            return ApiResponse::success([
                'reference' => $merchantOrderId,
                'transaction_id' => $id,
                'success' => $success,
                'amount_cents' => $amountCents,
                'currency' => $currency,
            ], $success ? 'Payment successful' : 'Payment failed');
        }

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:8080');
        if (empty($frontendUrl)) {
            $frontendUrl = 'http://localhost:8080';
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

        return redirect(rtrim($frontendUrl, '/').'/app/payment-success.html?'.$redirectParams);
    }
}
