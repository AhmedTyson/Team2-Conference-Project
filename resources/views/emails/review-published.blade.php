@extends('emails.layouts.main')
@section('title', 'Your Review Has Been Published')

@section('content')
<div style="text-align: center; margin-bottom: 28px;">
    <div class="icon-badge badge-blue">
        <span>⭐</span>
    </div>
    <h2 style="color: #0F2854;">Your Review is Live!</h2>
    <p style="color: #4988C4; font-size: 14px; margin: 0;">The community can now see your feedback.</p>
</div>

<p>Hi <strong>{{ $notifiable->name }}</strong>,</p>
<p>Great news! Your review has passed moderation and is now publicly visible on <strong>{{ config('app.name', 'Voyago') }}</strong>.</p>

<div style="background: #f8faff; border: 1px solid #BDE8F5; border-radius: 10px; padding: 20px; margin: 24px 0;">
    <div style="margin-bottom: 12px;">
        @for($i = 1; $i <= 5; $i++)
            <span style="font-size: 20px; color: {{ $i <= ($review->rating ?? 5) ? '#f59e0b' : '#d1d5db' }};">★</span>
        @endfor
        <span style="font-size: 13px; color: #6b7280; margin-left: 8px;">{{ $review->rating ?? 5 }}/5</span>
    </div>
    @if($review->comment)
    <p style="margin: 0; font-style: italic; color: #374151; font-size: 15px; line-height: 1.7;">"{{ $review->comment }}"</p>
    @endif
</div>

<div class="callout callout-blue">
    <p>Your reviews help other travellers make better decisions. Thank you for contributing to the community!</p>
</div>

<div class="btn-container">
    <a href="{{ url('/my-reviews') }}" class="btn">View All My Reviews</a>
</div>
@endsection
