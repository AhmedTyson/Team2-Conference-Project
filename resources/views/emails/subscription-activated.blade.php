@extends('emails.layouts.main')

@section('content')
    <h3>Subscription Activated!</h3>
    <p>Dear {{ $user->name }},</p>
    <p>Your subscription to the <strong>{{ $subscription->plan->name }}</strong> plan has been activated.</p>
    <p>You now have access to premium features and an AI quota of {{ $subscription->plan->ai_quota_monthly }} generations.</p>
    <a href="{{ url('/dashboard/subscription') }}" class="button">View Subscription</a>
@endsection
