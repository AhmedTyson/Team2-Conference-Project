<?php

namespace App\Services\Commerce;

use App\Enums\OrderStatus;
use App\Interfaces\Commerce\OrderRepositoryInterface;
use App\Interfaces\Commerce\PaymentGatewayInterface;
use App\Interfaces\Commerce\PaymentRepositoryInterface;
use App\Models\Account\User;
use App\Models\Commerce\Order;
use App\Strategies\Checkout\CheckoutStrategyFactory;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class CheckoutService
{
    public function __construct(
        protected PaymentGatewayInterface $paymentGateway,
        protected OrderRepositoryInterface $orderRepository,
        protected PaymentRepositoryInterface $paymentRepository
    ) {}

    public function processCheckout(User $user, string $type, int $productId, array $billingData, ?string $idempotencyKey = null): array
    {
        if ($idempotencyKey) {
            $reusable = $this->findReusableCheckout($user->id, $idempotencyKey);

            if ($reusable !== null) {
                return $reusable;
            }

            $alreadyProcessed = Order::query()
                ->where('user_id', $user->id)
                ->where('idempotency_key', $idempotencyKey)
                ->where('status', '!=', OrderStatus::PENDING)
                ->exists();

            if ($alreadyProcessed) {
                throw new Exception('Checkout already processed.');
            }
        }

        $strategy = CheckoutStrategyFactory::make($type);

        $product = $strategy->resolveProduct($productId);

        // SEC-04 (D1 — Option B): fork is only allowed for public trips or the owner's own trip.
        // This guard fires before any Order/Payment rows are created or the gateway is called.
        if ($type === 'trip_fork' && Gate::forUser($user)->denies('fork', $product)) {
            throw new AuthorizationException('You are not authorized to fork this trip.');
        }

        $totalCents = $strategy->calculatePrice($product);

        if ($totalCents <= 0) {
            throw new Exception('Invalid order amount.');
        }

        $order = DB::transaction(function () use ($user, $totalCents, $strategy, $product, $idempotencyKey) {
            $order = $this->orderRepository->createOrder($user->id, $totalCents, 'EGP', $idempotencyKey);
            $this->orderRepository->createOrderItem($order, $product, $totalCents, ['purchase_type' => $strategy->getPurchaseType()]);

            return $order;
        });

        $billingData = $this->prepareBillingData($user, $billingData);
        $referenceId = 'ORDER_'.$order->id.'_'.time();

        $gatewayResponse = $this->paymentGateway->createIntention(
            $referenceId,
            $totalCents,
            $order->currency,
            $billingData
        );

        if (! $gatewayResponse['success']) {
            $this->orderRepository->updateStatus($order, OrderStatus::FAILED->value);
            throw new Exception($gatewayResponse['message']);
        }

        $this->paymentRepository->createPendingPayment(
            $order->id,
            $referenceId,
            $totalCents,
            $order->currency,
            $gatewayResponse['client_secret'] ?? null,
            $gatewayResponse['checkout_url'] ?? null,
        );

        return [
            'order_id' => $order->id,
            'client_secret' => $gatewayResponse['client_secret'],
            'checkout_url' => $gatewayResponse['checkout_url'],
        ];
    }

    /**
     * SEC-08: a repeated initiation with the same idempotency key reuses the
     * existing pending checkout instead of creating a new order/payment and
     * hitting the gateway again.
     */
    protected function findReusableCheckout(int $userId, string $idempotencyKey): ?array
    {
        $order = Order::query()
            ->where('user_id', $userId)
            ->where('idempotency_key', $idempotencyKey)
            ->where('status', OrderStatus::PENDING)
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->latest('id')
            ->first();

        if (! $order) {
            return null;
        }

        $payment = $order->latestPayment;

        if (! $payment || ! $payment->client_secret || ! $payment->checkout_url) {
            return null;
        }

        return [
            'order_id' => $order->id,
            'client_secret' => $payment->client_secret,
            'checkout_url' => $payment->checkout_url,
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
