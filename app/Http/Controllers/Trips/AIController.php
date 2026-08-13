<?php

namespace App\Http\Controllers\Trips;

use App\Http\Controllers\Controller;
use App\Models\Trips\Trip;
use App\Services\GroqService;
use App\Services\Trips\AiUsageService;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AIController extends Controller
{
    use AuthorizesRequests;

    public function enhance(Request $request)
    {
        $request->validate(['content' => 'required|string']);

        $groq = new GroqService(app(AiUsageService::class));

        $enhancedContent = $groq->enhance($request->input('content'));

        return ApiResponse::success($enhancedContent, 'Content enhanced successfully');
    }

    // review my trip

    public function review(Request $request, string $id)
    {
        $trip = Trip::with(['itineraryItems.itemable', 'destinations'])->find($id);

        if (! $trip) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        // SEC-02: ownership gate mirrors TripController::show — 404, no existence leak.
        if (Gate::forUser($request->user())->denies('view', $trip)) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        $aiUsage = app(AiUsageService::class);
        $groq = new GroqService($aiUsage);

        $trip_items = $trip->itineraryItems;
        $trip_title = $trip->title;

        // SEC-11: quota is now consumed INSIDE GroqService::review's Cache::remember closure,
        // so cache hits do NOT decrement the user's quota.
        $reviewedContent = $groq->review($trip, $trip_title, $trip_items, $request->user());

        return ApiResponse::success(json_decode($reviewedContent) ?? $reviewedContent, 'Trip reviewed successfully');
    }
}
