@extends('emails.layouts.main')
@section('title', 'Trip Booked')

@section('content')
<div class="headline">
    <p class="eyebrow">Confirmation</p>
    <h2 style="margin-top: 0;">Your trip is booked</h2>
</div>

<p>Hi <strong>{{ $trip->user->name ?? 'there' }}</strong>,</p>
<p>Your trip has been booked and confirmed. Here are your trip details:</p>

<div class="card card-mint">
    <table>
        <tr>
            <td class="k">Trip name</td>
            <td class="v">{{ $trip->title }}</td>
        </tr>
        @if($trip->destinations && $trip->destinations->count())
        <tr>
            <td class="k">Destination</td>
            <td class="v">{{ $trip->destinations->pluck('name')->join(', ') }}</td>
        </tr>
        @endif
        @if($trip->start_date)
        <tr>
            <td class="k">Start date</td>
            <td class="v">{{ \Carbon\Carbon::parse($trip->start_date)->format('M d, Y') }}</td>
        </tr>
        @endif
        @if($trip->end_date)
        <tr>
            <td class="k">End date</td>
            <td class="v">{{ \Carbon\Carbon::parse($trip->end_date)->format('M d, Y') }}</td>
        </tr>
        @endif
        <tr>
            <td class="k">Booking ref</td>
            <td class="v" style="font-family: monospace; color: #5EAAA8;">#TRIP-{{ str_pad($trip->id, 6, '0', STR_PAD_LEFT) }}</td>
        </tr>
    </table>
</div>

<div class="callout">
    <span class="label">Next step</span>
    <p>Open your trip planner to finalise the daily schedule and add any custom activities.</p>
</div>

<div class="btn-container">
    <a href="{{ url('/trips/' . $trip->id) }}" class="btn">View my trip</a>
</div>

<hr class="divider">
<p style="font-size: 13px; color: #7A756E; margin: 0;">Need help? Contact our support team anytime. Bon voyage.</p>
@endsection