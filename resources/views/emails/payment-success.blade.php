@extends('emails.layouts.main')

@section('content')
    <h3>Payment Successful!</h3>
    <p>Dear {{ $user->name }},</p>
    <p>We successfully received your payment of {{ number_format($order->total_cents / 100, 2) }} {{ $order->currency }}.</p>
    <p>Your order (ID: {{ $order->id }}) has been fulfilled.</p>
    <a href="{{ url('/dashboard') }}" class="button">View Dashboard</a>
@endsection
