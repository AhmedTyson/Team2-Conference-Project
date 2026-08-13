<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\Commerce\AgencyAssignment;
use App\Models\System\Flag;
use App\Services\System\FlagService;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class FlagController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private FlagService $service) {}

    public function store(Request $request, AgencyAssignment $assignment): JsonResponse
    {
        $this->authorize('createForAssignment', [Flag::class, $assignment]);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
            'details' => 'nullable|string|max:5000',
        ]);

        $flag = $this->service->fileComplaint(
            $request->user(),
            $assignment,
            $validated['reason'],
            $validated['details'] ?? null
        );

        return ApiResponse::success($flag, 'Flag submitted successfully', 201);
    }
}
