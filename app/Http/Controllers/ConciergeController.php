<?php

namespace App\Http\Controllers;

use App\Models\Trips\Trip;
use App\Services\ConciergeService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ConciergeController extends Controller
{
    public function __construct(
        private ConciergeService $conciergeService
    ) {}

    public function ask(Request $request, Trip $trip)
    {

        // Trip ownership
        if ($trip->user_id !== $request->user()->id) {
            return ApiResponse::fail('Trip not found or does not belong to this user.', 'not_found', 404);
        }

        $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $response = $this->conciergeService->ask(
            $trip,
            $request->message
        );

        return ApiResponse::success(['response' => $response], 'Concierge response generated successfully');
    }
}
