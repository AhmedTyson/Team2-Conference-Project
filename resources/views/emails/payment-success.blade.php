@extends('emails.layouts.main')
@section('title', 'Payment Receipt')

@section('content')
<div style="text-align: center; margin-bottom: 28px;">
    <div class="icon-badge badge-green">
        <span>✅</span>
    </div>
    <h2 style="color: #065f46;">Payment Successful</h2>
    <p style="color: #10b981; font-size: 14px; margin: 0;">Your transaction is confirmed.</p>
</div>

<p>Hi <strong>{{ $user->name }}</strong>,</p>
<p>Thank you for your purchase! We successfully received your payment. Below are your transaction details for your records.</p>

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
                <strong style="color: #0F2854;">Order #{{ $order->id }}</strong><br>
                <span style="color: #6b7280; font-size: 12px;">{{ $order->created_at->format('M d, Y — H:i') }}</span>
            </td>
            <td style="text-align: right; font-weight: 600; color: #0F2854;">
                {{ number_format($order->total_cents / 100, 2) }} {{ strtoupper($order->currency) }}
            </td>
        </tr>
        <tr class="total">
            <td>Total Paid</td>
            <td style="text-align: right; color: #047857;">
                {{ number_format($order->total_cents / 100, 2) }} {{ strtoupper($order->currency) }}
            </td>
        </tr>
    </tbody>
</table>

<div class="callout callout-blue">
    <p>Keep this email as your payment confirmation. A detailed invoice is available in your dashboard.</p>
</div>

<div class="btn-container">
    <a href="{{ url('/dashboard/orders/' . $order->id) }}" class="btn btn-green">View Full Receipt</a>
</div>

<hr class="divider">
<p style="font-size: 13px; color: #6b7280; margin: 0;">If you have questions about this charge, contact our support team.</p>
@endsection
