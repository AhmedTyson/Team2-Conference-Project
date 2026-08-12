@extends('emails.layouts.main')
@section('title', 'Welcome to ' . config('app.name', 'Voyago'))

@section('content')
<div style="text-align: center; margin-bottom: 28px;">
    <div class="icon-badge badge-ice">
        <span>✈️</span>
    </div>
    <h2 style="color: #0F2854;">Welcome aboard, {{ $user->name }}!</h2>
    <p style="color: #4988C4; font-size: 14px; margin: 0;">Your adventure starts now.</p>
</div>

<p>We're thrilled to have you join <strong>{{ config('app.name', 'Voyago') }}</strong> — the smart platform that turns travel dreams into perfectly planned realities.</p>

<div class="callout callout-ice">
    <p><strong>Pro Tip:</strong> Complete your profile preferences so our AI can tailor recommendations perfectly to your travel style!</p>
</div>

<p>Here is what you can do right now:</p>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #BDE8F5; vertical-align: top; width: 36px; font-size: 20px;">🗺️</td>
        <td style="padding: 12px 0 12px 12px; border-bottom: 1px solid #BDE8F5;">
            <strong style="color: #0F2854;">Plan Trips</strong><br>
            <span style="color: #6b7280; font-size: 14px;">Use our AI to instantly generate optimized, multi-day itineraries.</span>
        </td>
    </tr>
    <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #BDE8F5; vertical-align: top; font-size: 20px;">🏨</td>
        <td style="padding: 12px 0 12px 12px; border-bottom: 1px solid #BDE8F5;">
            <strong style="color: #0F2854;">Book Packages</strong><br>
            <span style="color: #6b7280; font-size: 14px;">Reserve hotels and flights securely in one click.</span>
        </td>
    </tr>
    <tr>
        <td style="padding: 12px 0; vertical-align: top; font-size: 20px;">🔄</td>
        <td style="padding: 12px 0 12px 12px;">
            <strong style="color: #0F2854;">Fork &amp; Share</strong><br>
            <span style="color: #6b7280; font-size: 14px;">Find an inspiring trip? Clone it and make it your own.</span>
        </td>
    </tr>
</table>

<div class="btn-container">
    <a href="{{ url('/dashboard') }}" class="btn">Start Exploring Now</a>
</div>

<hr class="divider">
<p style="font-size: 13px; color: #6b7280; margin: 0;">Happy travels,<br><strong style="color: #0F2854;">The {{ config('app.name', 'Voyago') }} Team</strong></p>
@endsection
