@extends('emails.layouts.main')
@section('title', 'Payment Failed')

@section('content')
<div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; background-color: #fee2e2; padding: 16px; border-radius: 50%; margin-bottom: 16px;">
        <span style="font-size: 32px; line-height: 1;">⚠️</span>
    </div>
    <h2 style="color: #991b1b;">Payment Failed</h2>
</div>

<p>Hi {{ $user->name }},</p>
<p>Unfortunately, your recent payment attempt for <strong>Order #{{ $order->id }}</strong> could not be processed successfully.</p>

<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
    <p style="margin: 0; color: #991b1b; font-size: 15px;"><strong>Amount Attempted:</strong> {{ number_format($order->total_cents / 100, 2) }} {{ strtoupper($order->currency) }}<br>No charges were applied to your account.</p>
</div>

<p>This usually happens due to insufficient funds, an expired card, or a bank block. Please update your payment method or try completing the checkout again to ensure your purchase is fulfilled.</p>

<div class="btn-container">
    <a href="{{ url('/checkout/retry/' . $order->id) }}" class="btn btn-danger">Retry Payment Now</a>
</div>

<p style="font-size: 14px; margin-top: 32px;">If the problem persists, please reach out to your bank or contact our support team.</p>
@endsection
