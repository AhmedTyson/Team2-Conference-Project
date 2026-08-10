<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Services\Commerce\AgencyAssignmentService;
use Illuminate\Http\Request;

class AgencyRequestController extends Controller
{
    public function __construct(private AgencyAssignmentService $service) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'budget_level' => 'nullable|string|in:low,medium,high,luxury',
        ]);

        $assignment = $this->service->requestAssignment(
            $request->user()->id, 
            $validated['budget_level'] ?? null
        );

        return response()->json(['data' => $assignment], 201);
    }
}
