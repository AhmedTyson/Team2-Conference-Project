@extends('emails.layouts.main')
@section('title', 'Your Review Has Been Flagged')

@section('content')
<div style="text-align: center; margin-bottom: 28px;">
    <div class="icon-badge badge-amber">
        <span>🚩</span>
    </div>
    <h2 style="color: #92400e;">Review Under Review</h2>
    <p style="color: #b45309; font-size: 14px; margin: 0;">Our moderation team is looking into a flag on your review.</p>
</div>

<p>Hi <strong>{{ $notifiable->name }}</strong>,</p>
<p>We're writing to let you know that one of your reviews has been flagged by a community member and is currently under review by our moderation team.</p>

<div class="callout callout-amber">
    <p><strong>What this means:</strong> Your review has been temporarily hidden from public view while we investigate. This is a routine process and does not imply a violation on your part.</p>
</div>

@if($review->comment)
<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 24px 0;">
    <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em;">Flagged Review</p>
    <p style="margin: 0; font-style: italic; color: #374151; font-size: 15px; line-height: 1.7;">"{{ Str::limit($review->comment, 200) }}"</p>
</div>
@endif

<p>Our team will complete the review within <strong>48 hours</strong>. You will receive a follow-up email with the outcome.</p>

<div class="btn-container">
    <a href="{{ url('/my-reviews') }}" class="btn btn-navy">View My Reviews</a>
</div>

<hr class="divider">
<p style="font-size: 13px; color: #6b7280; margin: 0;">If you believe this flag is a mistake, please contact our support team. We take community standards seriously and appreciate your understanding.</p>
@endsection
