@extends('emails.layouts.main')
@section('title', 'Payment Failed')

@section('content')
<div style="text-align: center; margin-bottom: 28px;">
    <div class="icon-badge badge-red">
        <span>⚠️</span>
    </div>
    <h2 style="color: #991b1b;">Payment Failed</h2>
    <p style="color: #ef4444; font-size: 14px; margin: 0;">Action required — your booking is on hold.</p>
</div>

<p>Hi <strong>{{ $user->name }}</strong>,</p>
<p>Unfortunately, your recent payment attempt for <strong style="color: #0F2854;">Order #{{ $order->id }}</strong> could not be processed successfully.</p>

<div class="callout callout-red">
    <p>
        <strong>Amount Attempted:</strong> {{ number_format($order->total_cents / 100, 2) }} {{ strtoupper($order->currency) }}<br>
        <span style="margin-top: 4px; display: block;">No charges were applied to your account.</span>
    </p>
</div>

<p>This usually happens due to:</p>
<table style="width: 100%; border-collapse: collapse; margin: 8px 0 20px;">
    <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #fee2e2; color: #374151; font-size: 14px;">💳 Insufficient funds or card limit reached</td>
    </tr>
    <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #fee2e2; color: #374151; font-size: 14px;">📅 Expired card</td>
    </tr>
    <tr>
        <td style="padding: 8px 0; color: #374151; font-size: 14px;">🏦 Bank security block on online transactions</td>
    </tr>
</table>

<p>Please update your payment method or retry the checkout to complete your booking.</p>

<div class="btn-container">
    <a href="{{ url('/checkout/retry/' . $order->id) }}" class="btn btn-danger">Retry Payment Now</a>
</div>

<hr class="divider">
<p style="font-size: 13px; color: #6b7280; margin: 0;">If the problem persists, please contact your bank or reach our support team.</p>
@endsection
