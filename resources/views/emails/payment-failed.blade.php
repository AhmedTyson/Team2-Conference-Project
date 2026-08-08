@extends('emails.layouts.main')

@section('content')
    <h3>Payment Failed</h3>
    <p>Dear {{ $user->name }},</p>
    <p>Unfortunately, your payment attempt for Order #{{ $order->id }} has failed.</p>
    <p>Please update your payment method or try again.</p>
    <a href="{{ url('/checkout') }}" class="button">Retry Payment</a>
@endsection
