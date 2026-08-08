<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\GroqService;
use App\Http\Requests\AiTripRequest;
use App\Models\Trip;
use App\Services\AiUsageService;

class AIController extends Controller
{
    public function enhance(AiTripRequest $request){

        $groq = new GroqService(app(AiUsageService::class));

        $enhancedContent = $groq->enhance($request);

        return response()->json([
            'success' => true,
            'message' => 'Content enhanced successfully',
            'data' => $enhancedContent
        ]);
    }

    //review my trip 

    public function review(Request $request, string $id){

       $aiUsage = app(AiUsageService::class);
       $aiUsage->consumeQuota($request->user());

       $groq = new GroqService($aiUsage);

       $trip = Trip::find($id);

       if(!$trip){
        $aiUsage->restoreQuota($request->user());
        return response()->json([
            'success' => false,
            'message' => 'Trip not found',
        ], 404);
       }

       $trip = Trip::where('id', $id)->with(['itineraryItems.itemable', 'destinations'])->first();

        $trip_id = Trip::find($trip->id);

        $trip_items = $trip->itineraryItems;

        $trip_title = $trip->title;

        try {
            $reviewedContent = $groq->review($trip_id,$trip_title, $trip_items);
        } catch (\Throwable $e) {
            $aiUsage->restoreQuota($request->user());
            throw $e;
        }

        return response()->json([
            'success' => true,
            'message' => 'Trip reviewed successfully',
            'data' => json_decode($reviewedContent) ?? $reviewedContent
        ]);
    }
}
