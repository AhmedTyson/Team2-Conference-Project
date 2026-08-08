@extends('emails.layouts.main')

@section('content')
    <h3>Welcome to {{ config('app.name') }}!</h3>
    <p>Dear {{ $user->name }},</p>
    <p>We are thrilled to have you onboard. You can now start planning trips, booking hotels, and exploring destinations!</p>
    <a href="{{ url('/dashboard') }}" class="button">Go to Dashboard</a>
@endsection
