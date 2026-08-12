@extends('emails.layouts.main')
@section('title', 'Trip Booked Successfully!')

@section('content')
<div style="text-align: center; margin-bottom: 28px;">
    <div class="icon-badge badge-blue">
        <span>🎉</span>
    </div>
    <h2 style="color: #0F2854;">Your Trip is Booked!</h2>
    <p style="color: #4988C4; font-size: 14px; margin: 0;">Everything is confirmed. Time to get excited!</p>
</div>

<p>Hi <strong>{{ $notifiable->name }}</strong>,</p>
<p>Your trip has been successfully booked and confirmed. Here are your trip details:</p>

<div style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #BDE8F5; border-radius: 10px; padding: 24px; margin: 24px 0;">
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 40%;">Trip Name</td>
            <td style="padding: 8px 0; font-weight: 700; color: #0F2854;">{{ $trip->title }}</td>
        </tr>
        @if($trip->destinations && $trip->destinations->count())
        <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Destination</td>
            <td style="padding: 8px 0; font-weight: 600; color: #1C4D8D;">{{ $trip->destinations->pluck('name')->join(', ') }}</td>
        </tr>
        @endif
        @if($trip->start_date)
        <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Start Date</td>
            <td style="padding: 8px 0; color: #374151;">{{ \Carbon\Carbon::parse($trip->start_date)->format('M d, Y') }}</td>
        </tr>
        @endif
        @if($trip->end_date)
        <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">End Date</td>
            <td style="padding: 8px 0; color: #374151;">{{ \Carbon\Carbon::parse($trip->end_date)->format('M d, Y') }}</td>
        </tr>
        @endif
        <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Booking Ref</td>
            <td style="padding: 8px 0; font-family: monospace; color: #4988C4; font-weight: 600;">#TRIP-{{ str_pad($trip->id, 6, '0', STR_PAD_LEFT) }}</td>
        </tr>
    </table>
</div>

<div class="callout callout-ice">
    <p>💡 <strong>Next Step:</strong> Check your trip planner to finalize your daily schedule and add any custom activities.</p>
</div>

<div class="btn-container">
    <a href="{{ url('/trips/' . $trip->id) }}" class="btn">View My Trip</a>
</div>

<hr class="divider">
<p style="font-size: 13px; color: #6b7280; margin: 0;">Need help? Contact our support team anytime. Bon voyage! ✈️</p>
@endsection
