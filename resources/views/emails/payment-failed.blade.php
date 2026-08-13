@extends('emails.layouts.main')
@section('title', 'Payment Not Completed')

@section('content')
<div class="headline">
    <p class="eyebrow">Action required</p>
    <h2 style="margin-top: 0;">Payment not completed</h2>
</div>

<p>Hi <strong>{{ $user->name }}</strong>,</p>
<p>We could not process your recent payment for <strong style="color: #056676;">Order #{{ $order->id }}</strong>. Your booking is on hold and no charge has been applied to your account.</p>

<div class="card card-warn">
    <table>
        <tr>
            <td class="k">Order reference</td>
            <td class="v">#{{ $order->id }}</td>
        </tr>
        <tr>
            <td class="k">Amount attempted</td>
            <td class="v">{{ number_format($order->total_cents / 100, 2) }} {{ strtoupper($order->currency) }}</td>
        </tr>
    </table>
</div>

<p style="font-size: 13px; color: #7A756E; margin-bottom: 14px;">Payments usually fail for one of these reasons:</p>
<table class="features">
    <tr>
        <td class="mark">&#8226;</td>
        <td class="feature-sub">Insufficient funds or card limit reached</td>
    </tr>
    <tr>
        <td class="mark">&#8226;</td>
        <td class="feature-sub">Expired card details</td>
    </tr>
    <tr>
        <td class="mark">&#8226;</td>
        <td class="feature-sub">Bank security block on online transactions</td>
    </tr>
</table>

<p>Update your payment method and retry to complete your booking.</p>

<div class="btn-container">
    <a href="{{ url('/checkout/retry/' . $order->id) }}" class="btn btn-outline">Retry payment</a>
</div>

<hr class="divider">
<p style="font-size: 13px; color: #7A756E; margin: 0;">If the problem persists, contact your bank or reach out to our support team.</p>
@endsection