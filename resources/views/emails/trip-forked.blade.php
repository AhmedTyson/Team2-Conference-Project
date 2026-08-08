@extends('emails.layouts.main')
@section('title', 'Your Trip was Forked!')

@section('content')
<div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; background-color: #f3e8ff; padding: 16px; border-radius: 50%; margin-bottom: 16px;">
        <span style="font-size: 32px; line-height: 1;">🌟</span>
    </div>
    <h2 style="color: #6b21a8;">Someone loved your trip!</h2>
</div>

<p>Hi {{ $originalTrip->user->name }},</p>
<p>Great news! Your expertly crafted itinerary <strong>"{{ $originalTrip->title }}"</strong> has just been cloned (forked) by another user in the community.</p>

<div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
    <p style="margin: 0; font-size: 15px; color: #4b5563;">
        Your trip to <strong>{{ $originalTrip->destinations->first()->name ?? 'a great destination' }}</strong> is inspiring others!
    </p>
</div>

<p>Every time your trip is forked, it proves how valuable your travel knowledge is. Keep creating amazing itineraries and building your reputation on the platform.</p>

<div class="btn-container">
    <a href="{{ url('/trips/' . $originalTrip->id) }}" class="btn" style="background-color: #7e22ce;">View Your Trip</a>
</div>
@endsection
