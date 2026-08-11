<?php

namespace App\Http\Controllers\Trips;

use App\Http\Controllers\Controller;
use App\Http\Requests\Trips\AiTripRequest;
use App\Models\Trips\Trip;
use App\Services\Trips\AiUsageService;
use App\Services\GroqService;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class AIController extends Controller
{
    use AuthorizesRequests;    public function enhance(Request $request)
    {
        $request->validate(['content' => 'required|string']);

        $groq = new GroqService(app(AiUsageService::class));

        $enhancedContent = $groq->enhance($request->input('content'));

        return response()->json([
            'success' => true,
            'message' => 'Content enhanced successfully',
            'data' => $enhancedContent,
        ]);
    }

    // review my trip

    public function review(Request $request, string $id)
    {
        $trip = Trip::with(['itineraryItems.itemable', 'destinations'])->find($id);

        if (! $trip) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        // Authorization happens BEFORE any quota consumption or external AI call.
        $this->authorize('view', $trip);

        $aiUsage = app(AiUsageService::class);
        $aiUsage->consumeQuota($request->user());

        $groq = new GroqService($aiUsage);

        $trip_items = $trip->itineraryItems;
        $trip_title = $trip->title;

        try {
            $reviewedContent = $groq->review($trip, $trip_title, $trip_items);
        } catch (\Throwable $e) {
            $aiUsage->restoreQuota($request->user());
            throw $e;
        }

        return response()->json([
            'success' => true,
            'message' => 'Trip reviewed successfully',
            'data' => json_decode($reviewedContent) ?? $reviewedContent,
        ]);
    }
}
