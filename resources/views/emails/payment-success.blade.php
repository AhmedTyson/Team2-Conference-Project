@extends('emails.layouts.main')
@section('title', 'Payment Receipt')

@section('content')
<div class="headline">
    <p class="eyebrow">Payment confirmed</p>
    <h2 style="margin-top: 0;">Payment successful</h2>
</div>

<p>Hi <strong>{{ $user->name }}</strong>,</p>
<p>We have received your payment. Your transaction details are below for your records.</p>

<table class="receipt">
    <thead>
        <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                <strong style="color: #056676;">Order #{{ $order->id }}</strong><br>
                <span style="color: #7A756E; font-size: 12px;">{{ $order->created_at->format('M d, Y — H:i') }}</span>
            </td>
            <td style="text-align: right; font-weight: 600; color: #3E3A33;">
                {{ number_format($order->total_cents / 100, 2) }} {{ strtoupper($order->currency) }}
            </td>
        </tr>
        <tr class="total">
            <td>Total paid</td>
            <td style="text-align: right;">
                {{ number_format($order->total_cents / 100, 2) }} {{ strtoupper($order->currency) }}
            </td>
        </tr>
    </tbody>
</table>

<div class="callout">
    <span class="label">Your receipt</span>
    <p>Keep this email as confirmation of your payment. A detailed invoice is always available in your dashboard.</p>
</div>

<div class="btn-container">
    <a href="{{ url('/dashboard.html') }}" class="btn btn-mint">View full receipt</a>
</div>

<hr class="divider">
<p style="font-size: 13px; color: #7A756E; margin: 0;">Questions about this charge? Our support team is here to help.</p>
@endsection