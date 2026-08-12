@extends('emails.layouts.main')
@section('title', 'Your Subscription is Active!')

@section('content')
<div style="text-align: center; margin-bottom: 28px;">
    <div class="icon-badge badge-amber">
        <span>👑</span>
    </div>
    <h2 style="color: #0F2854;">You're now Premium!</h2>
    <p style="color: #4988C4; font-size: 14px; margin: 0;">Full access unlocked — enjoy the benefits.</p>
</div>

<p>Hi <strong>{{ $user->name }}</strong>,</p>
<p>Congratulations! Your subscription to the <strong style="color: #1C4D8D;">{{ $subscription->plan->name ?? 'Premium' }} Plan</strong> has been successfully activated.</p>

<div style="background: linear-gradient(135deg, #0F2854, #1C4D8D); border-radius: 10px; padding: 24px; margin: 24px 0;">
    <h3 style="color: #BDE8F5; margin-top: 0; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase;">What you've unlocked</h3>
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(189,232,245,0.2); color: #ffffff; font-size: 14px;">
                🤖 <strong>Massive AI Quota</strong> — Generate up to {{ $subscription->plan->ai_quota_monthly ?? 50 }} itineraries/month
            </td>
        </tr>
        <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(189,232,245,0.2); color: #ffffff; font-size: 14px;">
                ⚡ <strong>Priority Support</strong> — Skip the queue and get help faster
            </td>
        </tr>
        <tr>
            <td style="padding: 10px 0; color: #ffffff; font-size: 14px;">
                🔓 <strong>Exclusive Destinations</strong> — Access premium-only travel packages
            </td>
        </tr>
    </table>
</div>

<p>Your AI generation counter has been fully reset and your new capabilities are live immediately. Go ahead and start planning!</p>

<div class="btn-container">
    <a href="{{ url('/dashboard/subscription') }}" class="btn btn-amber">View Subscription Details</a>
</div>
@endsection
