@extends('emails.layouts.main')
@section('title', 'Booking Cancelled')

@section('content')
<div style="text-align: center; margin-bottom: 28px;">
    <div class="icon-badge badge-red">
        <span>❌</span>
    </div>
    <h2 style="color: #991b1b;">Booking Cancelled</h2>
    <p style="color: #ef4444; font-size: 14px; margin: 0;">Your booking has been cancelled successfully.</p>
</div>

<p>Hi <strong>{{ $notifiable->name }}</strong>,</p>
<p>This email confirms that your booking for the following order has been cancelled:</p>

<table class="receipt">
    <thead>
        <tr>
            <th>Detail</th>
            <th style="text-align: right;">Info</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Order Reference</td>
            <td style="text-align: right; font-family: monospace; color: #0F2854; font-weight: 600;">#{{ $order->id }}</td>
        </tr>
        <tr>
            <td>Original Amount</td>
            <td style="text-align: right; color: #374151;">{{ number_format($order->total_cents / 100, 2) }} {{ strtoupper($order->currency) }}</td>
        </tr>
        <tr>
            <td>Cancelled On</td>
            <td style="text-align: right; color: #374151;">{{ now()->format('M d, Y') }}</td>
        </tr>
        <tr class="total">
            <td>Refund Status</td>
            <td style="text-align: right; color: #047857;">Processing (3–5 business days)</td>
        </tr>
    </tbody>
</table>

<div class="callout callout-blue">
    <p>If a refund is applicable, it will be returned to your original payment method within <strong>3–5 business days</strong>.</p>
</div>

<p>We hope to see you planning your next adventure soon!</p>

<div class="btn-container">
    <a href="{{ url('/explore') }}" class="btn">Explore New Trips</a>
</div>

<hr class="divider">
<p style="font-size: 13px; color: #6b7280; margin: 0;">Questions about your cancellation? Contact our support team — we're happy to help.</p>
@endsection
