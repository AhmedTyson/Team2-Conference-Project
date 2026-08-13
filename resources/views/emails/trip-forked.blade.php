@extends('emails.layouts.main')
@section('title', 'Your Trip Was Forked')

@section('content')
<div class="headline">
    <p class="eyebrow">Trip forked</p>
    <h2 style="margin-top: 0;">Your itinerary inspired someone</h2>
</div>

<p>Hi <strong>{{ $originalTrip->user->name }}</strong>,</p>
<p>Your itinerary <strong style="color: #056676;">"{{ $originalTrip->title }}"</strong> has just been cloned by another traveller in the community.</p>

<div class="card card-mint">
    <table>
        @if($originalTrip->destinations && $originalTrip->destinations->count())
        <tr>
            <td class="k">Destination</td>
            <td class="v">{{ $originalTrip->destinations->pluck('name')->join(', ') }}</td>
        </tr>
        @endif
        <tr>
            <td class="k">Copied by</td>
            <td class="v">A fellow traveller</td>
        </tr>
    </table>
</div>

<p>Every fork shows how valuable your travel knowledge is. Keep creating itineraries — your reputation on the platform grows with them.</p>

<div class="btn-container">
    <a href="{{ url('/trips/' . $originalTrip->id) }}" class="btn">View your trip</a>
</div>

<hr class="divider">
<p style="font-size: 13px; color: #7A756E; margin: 0;">Want to see who forked your trip? Check your notifications on the dashboard.</p>
@endsection