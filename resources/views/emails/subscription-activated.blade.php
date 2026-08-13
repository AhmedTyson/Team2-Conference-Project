@extends('emails.layouts.main')
@section('title', 'Subscription Active')

@section('content')
<div class="headline">
    <p class="eyebrow">Subscription active</p>
    <h2 style="margin-top: 0;">Premium is unlocked</h2>
</div>

<p>Hi <strong>{{ $user->name }}</strong>,</p>
<p>Your subscription to the <strong style="color: #056676;">{{ $subscription->plan->name ?? 'Premium' }} Plan</strong> is now active. Your new capabilities are live immediately.</p>

<div class="card" style="background-color: #056676; border-color: #056676;">
    <p style="margin: 0 0 10px; font-size: 10px; font-weight: 700; color: #A3D2CA; letter-spacing: 0.18em; text-transform: uppercase;">What you have unlocked</p>
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid rgba(163, 210, 202, 0.25); color: #ffffff; font-size: 14px;">
                <strong style="color: #A3D2CA;">AI planning</strong> — up to {{ $subscription->plan->ai_quota_monthly ?? 50 }} itinerary generations per month
            </td>
        </tr>
        <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid rgba(163, 210, 202, 0.25); color: #ffffff; font-size: 14px;">
                <strong style="color: #A3D2CA;">Priority support</strong> — skip the queue and get help faster
            </td>
        </tr>
        <tr>
            <td style="padding: 9px 0; color: #ffffff; font-size: 14px;">
                <strong style="color: #A3D2CA;">Exclusive packages</strong> — access premium-only offers
            </td>
        </tr>
    </table>
</div>

<p>Your AI generation counter has been reset for this cycle. Start planning your next journey.</p>

<div class="btn-container">
    <a href="{{ url('/dashboard.html') }}" class="btn btn-mint">Manage subscription</a>
</div>
@endsection