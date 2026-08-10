@extends('emails.layouts.main')
@section('title', 'Payment Receipt')

@section('content')
<div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; background-color: #d1fae5; padding: 16px; border-radius: 50%; margin-bottom: 16px;">
        <span style="font-size: 32px; line-height: 1;">✅</span>
    </div>
    <h2 style="color: #065f46;">Payment Successful</h2>
</div>

<p>Hi {{ $user->name }},</p>
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
                <strong>Order #{{ $order->id }}</strong><br>
                <span style="color: #6b7280; font-size: 13px;">{{ $order->created_at->format('M d, Y - H:i A') }}</span>
            </td>
            <td style="text-align: right; font-weight: 500;">
                {{ number_format($order->total_cents / 100, 2) }} {{ strtoupper($order->currency) }}
            </td>
        </tr>
        <tr class="total">
            <td>Total Paid</td>
            <td style="text-align: right; color: #10b981;">
                {{ number_format($order->total_cents / 100, 2) }} {{ strtoupper($order->currency) }}
            </td>
        </tr>
    </tbody>
</table>

<div class="btn-container">
    <a href="{{ url('/dashboard/orders/' . $order->id) }}" class="btn btn-success">View Full Receipt</a>
</div>

<p style="font-size: 14px; margin-top: 32px;">If you have any questions regarding this charge, please contact our support team.</p>
@endsection
