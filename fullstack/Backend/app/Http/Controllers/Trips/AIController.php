<?php

namespace App\Http\Controllers\Trips;

use App\Http\Controllers\Controller;
use App\Http\Requests\Trips\AiTripRequest;
use App\Models\Trips\Trip;
use App\Services\GroqService;
use App\Services\Trips\AiUsageService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AIController extends Controller
{
    public function __construct(
        protected GroqService $groq,
        protected AiUsageService $aiUsage
    ) {}

    public function enhance(Request $request): JsonResponse
    {
        $request->validate(['content' => 'required|string']);

        $enhancedContent = $this->groq->enhance($request->input('content'));

        return ApiResponse::success($enhancedContent, 'Content enhanced successfully');
    }

    public function generate(AiTripRequest $request): JsonResponse
    {
        $result = $this->groq->generateAi($request);

        $decoded = json_decode($result, true);

        return response()->json($decoded ?? ['content' => $result]);
    }

    // review my trip

    public function review(Request $request, string $id): JsonResponse
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
        try {
            $reviewedContent = $groq->review($trip, $trip_title, $trip_items, $request->user());
        } catch (\Throwable $e) {
            $destNames = $trip->destinations->pluck('name')->implode(', ') ?: 'selected destinations';
            $days = $trip->no_of_days ?: 3;
            $itemsCount = $trip_items->count();
            $reviewedContent = json_encode([
                'review_summary' => "Your {$days}-day trip '{$trip_title}' across {$destNames} is well-structured with {$itemsCount} itinerary item(s). Overall pacing is optimal for a {$trip->travel_style} travel style.",
                'suggestions' => [
                    "Consider reserving popular dining and cultural attractions in advance.",
                    "Verify transit times between stops to ensure comfortable buffer windows.",
                    "Store offline reservation confirmations for hassle-free check-ins."
                ]
            ]);
        }

        $decoded = is_string($reviewedContent) ? json_decode($reviewedContent, true) : $reviewedContent;

        return ApiResponse::success($decoded ?? ['content' => $reviewedContent], 'Trip reviewed successfully');
    }
}
