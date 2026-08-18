@extends('emails.layouts.main')
@section('title', 'Review Published')

@section('content')
<div class="headline">
    <p class="eyebrow">Community</p>
    <h2 style="margin-top: 0;">Your review is live</h2>
</div>

<p>Hi <strong>{{ $review->user->name ?? 'there' }}</strong>,</p>
<p>Your review has passed moderation and is now publicly visible on <strong>{{ config('app.name', 'Itinera') }}</strong>.</p>

<div class="card">
    <div style="margin-bottom: 12px;">
        @for($i = 1; $i <= 5; $i++)
            <span style="font-size: 18px; color: {{ $i <= ($review->rating ?? 5) ? '#5EAAA8' : '#D9CEC0' }};">&starf;</span>
        @endfor
        <span style="font-size: 13px; color: #7A756E; margin-left: 8px;">{{ $review->rating ?? 5 }}/5</span>
    </div>
    @if($review->comment)
    <p style="margin: 0; font-style: italic; color: #4A4640; font-size: 14px; line-height: 1.7;">"{{ $review->comment }}"</p>
    @endif
</div>

<div class="callout">
    <span class="label">Thank you</span>
    <p>Your reviews help other travellers make better decisions. Thank you for contributing to the community.</p>
</div>

<div class="btn-container">
    <a href="{{ url('/dashboard.html') }}" class="btn">View all my reviews</a>
</div>
@endsection