@extends('emails.layouts.main')
@section('title', 'Your Trip was Forked!')

@section('content')
<div style="text-align: center; margin-bottom: 28px;">
    <div class="icon-badge badge-blue">
        <span>🌟</span>
    </div>
    <h2 style="color: #0F2854;">Someone loved your trip!</h2>
    <p style="color: #4988C4; font-size: 14px; margin: 0;">Your itinerary inspired another traveller.</p>
</div>

<p>Hi <strong>{{ $originalTrip->user->name }}</strong>,</p>
<p>Great news! Your expertly crafted itinerary <strong style="color: #1C4D8D;">"{{ $originalTrip->title }}"</strong> has just been cloned (forked) by another user in the community.</p>

<div style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #BDE8F5; border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center;">
    <p style="margin: 0; font-size: 15px; color: #0F2854;">
        Your trip to <strong>{{ $originalTrip->destinations->first()->name ?? 'your destination' }}</strong> is inspiring others! 🌍
    </p>
</div>

<p>Every fork proves how valuable your travel knowledge is. Keep creating amazing itineraries and building your reputation on the platform.</p>

<div class="btn-container">
    <a href="{{ url('/trips/' . $originalTrip->id) }}" class="btn btn-navy">View Your Trip</a>
</div>

<hr class="divider">
<p style="font-size: 13px; color: #6b7280; margin: 0;">Want to see who forked your trip? Check your notifications on the dashboard.</p>
@endsection
