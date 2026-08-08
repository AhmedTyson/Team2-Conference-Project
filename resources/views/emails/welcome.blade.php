@extends('emails.layouts.main')
@section('title', 'Welcome to ' . config('app.name', 'Voyago'))

@section('content')
<div style="text-align: center; margin-bottom: 32px;">
    <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=600&h=250" alt="Travel Header" style="width: 100%; height: 200px; border-radius: 8px; object-fit: cover; background-color: #e5e7eb;">
</div>

<h2>Welcome aboard, {{ $user->name }}! ✈️</h2>

<p>We are absolutely thrilled to have you join our community of global explorers. Whether you're looking to curate your next big adventure with AI or discover hidden gems shared by other travelers, you're in exactly the right place.</p>

<div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
    <p style="margin: 0; color: #0369a1; font-weight: 500;"><strong>Pro Tip:</strong> Complete your profile preferences so our AI can tailor recommendations perfectly to your travel style!</p>
</div>

<p>Here is what you can do right now:</p>

<ul style="padding-left: 20px; color: #4b5563; font-size: 15px; margin: 24px 0;">
    <li style="margin-bottom: 12px;"><strong>🗺️ Plan Trips:</strong> Use our AI to instantly generate optimized, multi-day itineraries.</li>
    <li style="margin-bottom: 12px;"><strong>🏨 Book Packages:</strong> Reserve hotels and flights securely in one click.</li>
    <li style="margin-bottom: 12px;"><strong>🔄 Fork & Share:</strong> Find an inspiring trip? Clone it directly into your account and make it your own.</li>
</ul>

<div class="btn-container">
    <a href="{{ url('/dashboard') }}" class="btn">Start Exploring Now</a>
</div>

<p style="margin-top: 32px; font-size: 14px;">Happy travels,<br>The {{ config('app.name', 'Voyago') }} Team</p>
@endsection
