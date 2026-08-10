@extends('emails.layouts.main')
@section('title', 'Subscription Activated')

@section('content')
<div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; background-color: #fef3c7; padding: 16px; border-radius: 50%; margin-bottom: 16px;">
        <span style="font-size: 32px; line-height: 1;">👑</span>
    </div>
    <h2 style="color: #b45309;">You are now Premium!</h2>
</div>

<p>Hi {{ $user->name }},</p>
<p>Congratulations! Your subscription to the <strong>{{ $subscription->plan->name ?? 'Premium' }} Plan</strong> has been successfully activated.</p>

<div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 20px; border-radius: 8px; margin: 24px 0;">
    <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">Here is what you unlocked:</h3>
    <ul style="padding-left: 20px; color: #78350f; font-size: 15px; margin-bottom: 0;">
        <li style="margin-bottom: 8px;"><strong>🤖 Massive AI Quota:</strong> Generate up to {{ $subscription->plan->ai_quota_monthly ?? 50 }} optimized itineraries per month.</li>
        <li style="margin-bottom: 8px;"><strong>⚡ Priority Support:</strong> Skip the queue and get help faster.</li>
        <li style="margin-bottom: 0;"><strong>🔓 Exclusive Destinations:</strong> Access premium-only travel packages.</li>
    </ul>
</div>

<p>Your AI generation counter has been fully reset, and your new capabilities are available immediately. Go ahead and start planning!</p>

<div class="btn-container">
    <a href="{{ url('/dashboard/subscription') }}" class="btn btn-premium">View Subscription Details</a>
</div>
@endsection
