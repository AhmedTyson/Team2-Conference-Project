<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Enums\TripStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAnalyticsController extends Controller
{
    // Get Revenue Statistics (Analytics)
    
    public function revenue(Request $request): JsonResponse
    {
        // We consider trips with status 'booked' or 'completed' as successful bookings
        $bookedStatuses = [
            TripStatus::BOOKED->value, 
            TripStatus::COMPLETED->value
        ];

        // Total Revenue (sum of budgets for booked/completed trips)
        $totalRevenue = Trip::whereIn('status', $bookedStatuses)->sum('budget');

        // Total Bookings count
        $totalBookings = Trip::whereIn('status', $bookedStatuses)->count();

        // Average Booking Value
        $averageBookingValue = $totalBookings > 0 ? round($totalRevenue / $totalBookings, 2) : 0;

        // Monthly Revenue breakdown (Grouped by start date month in-memory for database safety)
        $tripsData = Trip::whereIn('status', $bookedStatuses)
            ->select('budget', 'start_date')
            ->get();

        $monthlyRevenue = $tripsData->groupBy(function ($trip) {
            return $trip->start_date ? $trip->start_date->format('Y-m') : 'Unknown';
        })->map(function ($trips) {
            return (float) $trips->sum('budget');
        });

        // Revenue by Travel Style
        $travelStyleRevenue = Trip::whereIn('status', $bookedStatuses)
            ->select('travel_style', \DB::raw('SUM(budget) as total'))
            ->groupBy('travel_style')
            ->pluck('total', 'travel_style')
            ->map(fn($val) => (float) $val);

        // Recent Bookings list (top 5 latest)
        $recentBookings = Trip::with('user')
            ->whereIn('status', $bookedStatuses)
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($trip) {
                return [
                    'id'         => $trip->id,
                    'user'       => [
                        'name'  => $trip->user?->name,
                        'email' => $trip->user?->email,
                    ],
                    'title'      => $trip->title,
                    'budget'     => (float) $trip->budget,
                    'start_date' => $trip->start_date?->format('Y-m-d'),
                    'status'     => $trip->status->value,
                    'created_at' => $trip->created_at?->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Revenue statistics retrieved successfully.',
            'data'    => [
                'total_revenue'         => (float) $totalRevenue,
                'total_bookings'        => $totalBookings,
                'average_booking_value' => (float) $averageBookingValue,
                'revenue_by_month'      => $monthlyRevenue,
                'revenue_by_travel_style'=> $travelStyleRevenue,
                'recent_bookings'       => $recentBookings,
            ]
        ]);
    }
}