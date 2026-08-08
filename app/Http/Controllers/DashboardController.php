<?php

namespace App\Http\Controllers;

use App\Http\Resources\TripResource;
use App\Models\Favourite;
use App\Models\Trip;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    // Trip Statistics & Overview

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Total number of trips
        $totalTrips = Trip::where('user_id', $user->id)->count();

        // Count of trips by their status (pending, planning, etc.)
        $tripStats = Trip::where('user_id', $user->id)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $formattedStats = [
            'pending' => $tripStats['pending'] ?? 0,
            'planning' => $tripStats['planning'] ?? 0,
            'booked' => $tripStats['booked'] ?? 0,
            'completed' => $tripStats['completed'] ?? 0,
            'cancelled' => $tripStats['cancelled'] ?? 0,
        ];

        // Total number of favorites
        $totalFavourites = Favourite::where('user_id', $user->id)->count();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard statistics retrieved successfully.',
            'data' => [
                'total_trips' => $totalTrips,
                'trip_statistics' => $formattedStats,
                'total_favourites' => $totalFavourites,
            ],
        ]);
    }

    // Saved Trips & Booking History

    public function trips(Request $request): JsonResponse
    {
        $user = $request->user();

        // Fetch all trips for this user, sorted by newest first
        $trips = Trip::where('user_id', $user->id)->latest()->get();

        return response()->json([
            'success' => true,
            'message' => 'Saved trips retrieved successfully.',
            'data' => TripResource::collection($trips),
        ]);
    }

    // Favorite Destinations & Places

    public function favourites(Request $request): JsonResponse
    {
        $user = $request->user();

        // Fetch favorites with their morphed place details (Destinations, Hotels, etc.)
        $favourites = Favourite::with('favorable')
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Favorite places retrieved successfully.',
            'data' => $favourites->map(function ($fav) {
                return [
                    'id' => $fav->id,
                    'favorable_type' => $fav->favorable_type,
                    'favorable_id' => $fav->favorable_id,
                    'note' => $fav->note,
                    'item' => $fav->favorable, // The actual hotel, restaurant, or destination details
                    'created_at' => $fav->created_at,
                ];
            }),
        ]);
    }
}
