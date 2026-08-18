@extends('emails.layouts.main')
@section('title', 'Welcome to ' . config('app.name', 'Itinera'))

@section('content')
<div class="headline">
    <p class="eyebrow">Welcome</p>
    <h2 style="margin-top: 0;">Welcome aboard, {{ $user->name }}</h2>
</div>

<p>Thank you for joining <strong>{{ config('app.name', 'Itinera') }}</strong> — a platform built to turn travel ideas into carefully planned journeys.</p>

<div class="callout">
    <span class="label">Good to know</span>
    <p>Complete your travel preferences and our planning engine will tailor every suggestion to the way you like to travel.</p>
</div>

<p>Here is what you can do right away:</p>

<table class="features">
    <tr>
        <td class="mark">&#9656;</td>
        <td>
            <div class="feature-title">Plan trips</div>
            <div class="feature-sub">Generate optimised, day-by-day itineraries in seconds.</div>
        </td>
    </tr>
    <tr>
        <td class="mark">&#9656;</td>
        <td>
            <div class="feature-title">Book in one place</div>
            <div class="feature-sub">Reserve hotels and flights securely, without leaving the site.</div>
        </td>
    </tr>
    <tr>
        <td class="mark">&#9656;</td>
        <td>
            <div class="feature-title">Fork and share</div>
            <div class="feature-sub">Inspired by another traveller's trip? Clone it and make it your own.</div>
        </td>
    </tr>
</table>

<div class="btn-container">
    <a href="{{ url('/dashboard.html') }}" class="btn">Start planning</a>
</div>

<hr class="divider">
<p style="font-size: 13px; color: #7A756E; margin: 0;">
    Warm regards,<br>
    <strong style="color: #056676;">The {{ config('app.name', 'Itinera') }} Team</strong>
</p>
@endsection