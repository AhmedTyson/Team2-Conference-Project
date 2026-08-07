<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\GroqService;
use App\Http\Requests\AiTripRequest;
use App\Models\Trip;

class AIController extends Controller
{
    public function enhance(AiTripRequest $request){

        $groq = new GroqService();

        $enhancedContent = $groq->enhance($request);

        return response()->json([
            'success' => true,
            'message' => 'Content enhanced successfully',
            'data' => $enhancedContent
        ]);
    }

    //review my trip 

    public function review(string $id){

       $groq = new GroqService();

       $trip = Trip::find($id);

       if(!$trip){
        return response()->json([
            'success' => false,
            'message' => 'Trip not found',
        ], 404);
       }

       $trip = Trip::where('id', $id)->with(['itineraryItems.itemable', 'destinations'])->first();

        $trip_id = Trip::find($trip->id);

        $trip_items = $trip->itineraryItems;

        $trip_title = $trip->title;

        $reviewedContent = $groq->review($trip_id,$trip_title, $trip_items);

        return response()->json([
            'success' => true,
            'message' => 'Trip reviewed successfully',
            'data' => $reviewedContent
        ]);


    }
}
