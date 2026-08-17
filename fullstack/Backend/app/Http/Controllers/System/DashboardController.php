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

        $orders = \App\Models\Commerce\Order::with(['items', 'payments'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return ApiResponse::success(
            $orders->map(function ($order) {
                $latestPayment = $order->payments->last();
                $raw = ($latestPayment && is_array($latestPayment->raw_payload)) ? $latestPayment->raw_payload : [];
                $cardPan = $raw['source_data']['pan'] ?? ($raw['source_data_pan'] ?? '****');
                $cardType = $raw['source_data']['sub_type'] ?? ($raw['source_data_sub_type'] ?? 'Credit / Debit Card');
                $statusStr = $order->status instanceof \BackedEnum ? $order->status->value : (string) $order->status;

                return [
                    'id' => $order->id,
                    'merchant_order_id' => "ORDER_{$order->id}_" . ($order->created_at ? $order->created_at->timestamp : time()),
                    'status' => $statusStr,
                    'total_amount' => (float) ($order->total_amount ?: (($order->total_cents ?? 0) / 100)),
                    'total_cents' => (int) ($order->total_cents ?? 0),
                    'currency' => $order->currency ?: 'EGP',
                    'payment_gateway' => 'paymob',
                    'transaction_reference' => $latestPayment ? ($latestPayment->paymob_transaction_id ?: "PAYMOB-{$order->id}") : ($order->transaction_reference ?: "ORDER-{$order->id}"),
                    'card_pan' => $cardPan,
                    'card_type' => $cardType,
                    'items' => $order->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'product_type' => $item->product_type,
                            'product_id' => $item->product_id,
                            'price_cents' => $item->price_cents,
                            'name' => $item->metadata['name'] ?? ($item->product_type === 'subscription' ? 'Plan Subscription' : 'Trip Package'),
                            'metadata' => $item->metadata,
                        ];
                    }),
                    'created_at' => $order->created_at ? $order->created_at->toIso8601String() : now()->toIso8601String(),
                ];
            }),
            'User orders retrieved successfully.'
        );
    }

    /**
     * Lookup a specific order by reference, ID, or Paymob transaction ID.
     */
    public function lookupOrder(Request $request, string $orderRef): JsonResponse
    {
        $user = auth('api')->user();

        $numericId = null;
        if (is_numeric($orderRef)) {
            $numericId = (int) $orderRef;
        } elseif (preg_match('/ORDER_(\d+)/i', $orderRef, $matches)) {
            $numericId = (int) $matches[1];
        }

        $order = null;
        if ($numericId) {
            $order = \App\Models\Commerce\Order::with(['items', 'payments', 'user'])->find($numericId);
        }

        if (! $order) {
            $payment = \App\Models\Commerce\Payment::where('paymob_transaction_id', $orderRef)->first();
            if ($payment) {
                $order = \App\Models\Commerce\Order::with(['items', 'payments', 'user'])->find($payment->order_id);
            }
        }

        if (! $order) {
            return ApiResponse::fail('Order record not found', 'order_not_found', 404);
        }

        // Authorization check: ensure user owns the order if not admin
        if ($user && ! $user->hasRole('admin') && (int) $order->user_id !== (int) $user->id) {
            return ApiResponse::fail('Order record not found', 'order_not_found', 404);
        }

        $latestPayment = $order->payments()->latest()->first();
        $statusStr = $order->status instanceof \BackedEnum ? $order->status->value : (string) $order->status;

        $totalCents = (int) ($order->total_cents ?? 0);
        $totalAmount = $totalCents > 0 ? ($totalCents / 100) : 0.0;

        $raw = ($latestPayment && is_array($latestPayment->raw_payload)) ? $latestPayment->raw_payload : [];
        $cardPan = $raw['source_data']['pan'] ?? ($raw['source_data_pan'] ?? '****');
        $cardType = $raw['source_data']['sub_type'] ?? ($raw['source_data_sub_type'] ?? 'Credit / Debit Card');

        return ApiResponse::success([
            'order_id' => $order->id,
            'merchant_order_id' => "ORDER_{$order->id}_" . ($order->created_at ? $order->created_at->timestamp : time()),
            'status' => $statusStr,
            'is_success' => in_array(strtolower($statusStr), ['paid', 'fulfilled', 'completed']),
            'total_cents' => $totalCents,
            'total_amount' => $totalAmount,
            'currency' => $order->currency ?: 'EGP',
            'payment_gateway' => 'paymob',
            'transaction_id' => $latestPayment ? ($latestPayment->paymob_transaction_id ?: "PAYMOB-{$order->id}") : "ORDER-{$order->id}",
            'card_pan' => $cardPan,
            'card_type' => $cardType,
            'created_at' => $order->created_at ? $order->created_at->toIso8601String() : now()->toIso8601String(),
            'items' => $order->items->map(function ($item) {
                return [
                    'product_type' => $item->product_type,
                    'name' => $item->metadata['name'] ?? ($item->product_type === 'subscription' ? 'Plan Subscription' : 'Trip Package'),
                    'price_cents' => $item->price_cents,
                ];
            }),
        ], 'Order details retrieved successfully');
    }
}
