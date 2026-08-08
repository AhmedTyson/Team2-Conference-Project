<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Interfaces\OrderRepositoryInterface;
use App\Interfaces\PaymentGatewayInterface;
use App\Interfaces\PaymentRepositoryInterface;
use App\Models\User;
use App\Strategies\Checkout\CheckoutStrategyFactory;
use Illuminate\Support\Facades\DB;
use Exception;

class CheckoutService
{
    public function __construct(
        protected PaymentGatewayInterface $paymentGateway,
        protected OrderRepositoryInterface $orderRepository,
        protected PaymentRepositoryInterface $paymentRepository
    ) {}

    public function processCheckout(User $user, string $type, int $productId, array $billingData): array
    {
        $strategy = CheckoutStrategyFactory::make($type);
        
        $product = $strategy->resolveProduct($productId);
        $totalCents = $strategy->calculatePrice($product);

        if ($totalCents <= 0) {
            throw new Exception('Invalid order amount.');
        }

        $order = DB::transaction(function () use ($user, $totalCents, $strategy, $product) {
            $order = $this->orderRepository->createOrder($user->id, $totalCents, 'EGP');
            $this->orderRepository->createOrderItem($order, $product, $totalCents, ['purchase_type' => $strategy->getPurchaseType()]);
            return $order;
        });

        $billingData = $this->prepareBillingData($user, $billingData);
        $referenceId = 'ORDER_' . $order->id . '_' . time();

        $gatewayResponse = $this->paymentGateway->createIntention(
            $referenceId,
            $totalCents,
            $order->currency,
            $billingData
        );

        if (!$gatewayResponse['success']) {
            $this->orderRepository->updateStatus($order, OrderStatus::FAILED->value);
            throw new Exception($gatewayResponse['message']);
        }

        $this->paymentRepository->createPendingPayment(
            $order->id,
            $referenceId,
            $totalCents,
            $order->currency
        );

        return [
            'order_id' => $order->id,
            'client_secret' => $gatewayResponse['client_secret'],
            'checkout_url' => $gatewayResponse['checkout_url'],
        ];
    }

    protected function prepareBillingData(User $user, array $billingData): array
    {
        $billingData['email'] = $billingData['email'] ?? $user->email;
        $billingData['first_name'] = $billingData['first_name'] ?? $user->name;
        $billingData['last_name'] = $billingData['last_name'] ?? 'User';
        $billingData['phone_number'] = $billingData['phone_number'] ?? ($user->phone ?? '01000000000');

        return $billingData;
    }
}
