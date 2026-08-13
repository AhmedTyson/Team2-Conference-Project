@extends('emails.layouts.main')
@section('title', 'Booking Cancelled')

@section('content')
<div class="headline">
    <p class="eyebrow">Booking update</p>
    <h2 style="margin-top: 0;">Booking cancelled</h2>
</div>

<p>Hi <strong>{{ $order->user->name ?? 'there' }}</strong>,</p>
<p>This email confirms that your booking has been cancelled. Details of the cancelled order:</p>

<table class="receipt">
    <thead>
        <tr>
            <th>Detail</th>
            <th style="text-align: right;">Info</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Order reference</td>
            <td style="text-align: right; font-family: monospace; font-weight: 600; color: #056676;">#{{ $order->id }}</td>
        </tr>
        <tr>
            <td>Original amount</td>
            <td style="text-align: right; color: #3E3A33;">{{ number_format($order->total_cents / 100, 2) }} {{ strtoupper($order->currency) }}</td>
        </tr>
        <tr>
            <td>Cancelled on</td>
            <td style="text-align: right; color: #3E3A33;">{{ now()->format('M d, Y') }}</td>
        </tr>
        <tr class="total">
            <td>Refund status</td>
            <td style="text-align: right;">Processing within 3&ndash;5 business days</td>
        </tr>
    </tbody>
</table>

<div class="callout">
    <span class="label">Refund</span>
    <p>If a refund is applicable, it will be returned to your original payment method within <strong>3&ndash;5 business days</strong>.</p>
</div>

<p>We hope to see you planning your next journey soon.</p>

<div class="btn-container">
    <a href="{{ url('/planner.html') }}" class="btn">Explore new trips</a>
</div>

<hr class="divider">
<p style="font-size: 13px; color: #7A756E; margin: 0;">Questions about your cancellation? Contact our support team.</p>
@endsection