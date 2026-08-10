<?php

namespace App\Http\Controllers\Trips;

use App\Http\Controllers\Controller;
use App\Http\Requests\Trips\AiTripRequest;
use App\Models\Trips\Trip;
use App\Services\Trips\AiUsageService;
use App\Services\GroqService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function enhance(Request $request)
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

        $aiUsage = app(AiUsageService::class);
        $aiUsage->consumeQuota($request->user());

        $groq = new GroqService($aiUsage);

        $trip = Trip::find($id);

        if (! $trip) {
            $aiUsage->restoreQuota($request->user());

            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        $trip = Trip::where('id', $id)->with(['itineraryItems.itemable', 'destinations'])->first();

        $trip_id = Trip::find($trip->id);

        $trip_items = $trip->itineraryItems;

        $trip_title = $trip->title;

        try {
            $reviewedContent = $groq->review($trip_id, $trip_title, $trip_items);
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
