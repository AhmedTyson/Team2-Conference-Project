<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\TripResource;
use App\Models\Trips\Favourite;
use App\Models\Trips\Trip;
use App\Support\ApiResponse;
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

        return ApiResponse::success([
            'total_trips' => $totalTrips,
            'trip_statistics' => $formattedStats,
            'total_favourites' => $totalFavourites,
        ], 'Dashboard statistics retrieved successfully.');
    }

    // Saved Trips & Booking History

    public function trips(Request $request): JsonResponse
    {
        $user = $request->user();

        // Fetch all trips for this user, sorted by newest first
        $trips = Trip::where('user_id', $user->id)->latest()->get();

        return ApiResponse::success(
            TripResource::collection($trips),
            'Saved trips retrieved successfully.'
        );
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

        return ApiResponse::success(
            $favourites->map(function ($fav) {
                $typeMap = [
                    \App\Models\Catalog\Hotel::class => 'hotel',
                    \App\Models\Catalog\Restaurant::class => 'restaurant',
                    \App\Models\Catalog\Attraction::class => 'attraction',
                    \App\Models\Catalog\Destination::class => 'destination',
                    \App\Models\Catalog\Flight::class => 'flight',
                ];
                $shortType = $typeMap[$fav->favorable_type] ?? strtolower(class_basename($fav->favorable_type));

                return [
                    'id' => $fav->id,
                    'favorable_type' => $shortType,
                    'favorable_id' => $fav->favorable_id,
                    'note' => $fav->note,
                    'item' => $fav->favorable, // The actual hotel, restaurant, or destination details
                    'created_at' => $fav->created_at,
                ];
            }),
            'Favorite places retrieved successfully.'
        );
    }

    /**
     * Get orders / booking transactions for the authenticated user.
     */
    public function orders(Request $request): JsonResponse
    {
        $user = $request->user();

        $orders = \App\Models\Commerce\Order::with('items')
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return ApiResponse::success(
            $orders->map(function ($order) {
                return [
                    'id' => $order->id,
                    'status' => $order->status instanceof \BackedEnum ? $order->status->value : $order->status,
                    'total_amount' => (float) $order->total_amount,
                    'currency' => $order->currency ?: 'USD',
                    'payment_gateway' => $order->payment_gateway,
                    'transaction_reference' => $order->transaction_reference,
                    'confirmation_code' => $order->confirmation_code,
                    'items' => $order->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'product_type' => $item->product_type,
                            'product_id' => $item->product_id,
                            'price_cents' => $item->price_cents,
                            'metadata' => $item->metadata,
                        ];
                    }),
                    'created_at' => $order->created_at,
                ];
            }),
            'User orders retrieved successfully.'
        );
    }
}
