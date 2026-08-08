@extends('emails.layouts.main')

@section('content')
    <h3>Someone forked your trip!</h3>
    <p>Dear {{ $originalTrip->user->name }},</p>
    <p>Great news! Your trip "<strong>{{ $originalTrip->title }}</strong>" has been cloned/forked by another user.</p>
    <p>Keep creating amazing itineraries to inspire the community!</p>
    <a href="{{ url('/trips/' . $originalTrip->id) }}" class="button">View Trip</a>
@endsection
