@extends('emails.layouts.main')
@section('title', 'Review Under Review')

@section('content')
<div class="headline">
    <p class="eyebrow">Moderation</p>
    <h2 style="margin-top: 0;">Your review is temporarily hidden</h2>
</div>

<p>Hi <strong>{{ $review->user->name ?? 'there' }}</strong>,</p>
<p>One of your reviews has been flagged by a community member and is now being reviewed by our moderation team.</p>

<div class="callout">
    <span class="label">What this means</span>
    <p>Your review is temporarily hidden from public view while we investigate. This is a routine process and does not imply a violation on your part.</p>
</div>

@if($review->comment)
<div class="quote">
    <p>"{{ Str::limit($review->comment, 200) }}"</p>
</div>
@endif

<p>Our team will complete the review within <strong>48 hours</strong>. You will receive a follow-up email with the outcome.</p>

<div class="btn-container">
    <a href="{{ url('/dashboard.html') }}" class="btn btn-outline">View my reviews</a>
</div>

<hr class="divider">
<p style="font-size: 13px; color: #7A756E; margin: 0;">If you believe this flag is a mistake, please contact our support team. We take community standards seriously and appreciate your understanding.</p>
@endsection