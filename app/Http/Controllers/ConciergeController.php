<?php

namespace App\Http\Controllers;

use App\Models\Trip;
use App\Services\ConciergeService;
use Illuminate\Http\Request;

class ConciergeController extends Controller
{
    public function __construct(
        private ConciergeService $conciergeService
    ) {
    }

    public function ask(Request $request, Trip $trip)
    {
        // Trip ownership
        if ($trip->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Trip not found or does not belong to this user.',
            ], 404);
        }

        $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $response = $this->conciergeService->ask(
            $trip,
            $request->message
        );

        return response()->json([
            'success' => true,
            'message' => 'Concierge response generated successfully.',
            'data' => [
                'response' => $response,
            ],
        ]);
    }
}