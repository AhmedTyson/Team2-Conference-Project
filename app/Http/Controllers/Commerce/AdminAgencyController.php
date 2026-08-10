<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\AgencyAssignment;
use App\Services\Commerce\AgencyAssignmentService;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class AdminAgencyController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private AgencyAssignmentService $service) {}

    public function approve(Request $request, AgencyAssignment $assignment)
    {
        $this->authorize('approve', $assignment);

        $validated = $request->validate([
            'agency_user_id' => 'required|exists:users,id',
        ]);

        $assignment = $this->service->adminApprove(
            $assignment,
            $request->user()->id,
            $validated['agency_user_id']
        );

        return response()->json(['data' => $assignment]);
    }
}
