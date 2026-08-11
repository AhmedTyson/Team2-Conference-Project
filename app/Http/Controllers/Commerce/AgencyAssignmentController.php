<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\AgencyAssignment;
use App\Services\Commerce\AgencyAssignmentService;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class AgencyAssignmentController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private AgencyAssignmentService $service) {}

public function index(Request $request)
    {
        $assignments = AgencyAssignment::where('agency_user_id', $request->user()->id)
            ->with(['customer', 'trips'])
            ->get();
            
        return response()->json(['data' => $assignments]);
    }

    public function myAssignments(Request $request)
    {
        $assignments = $this->service->listForCustomer($request->user()->id);

        return response()->json(['data' => $assignments]);
    }

    public function cancel(Request $request, AgencyAssignment $assignment)
    {
        $this->authorize('cancel', $assignment);

        $assignment = $this->service->cancel($assignment, $request->user()->id);

        return response()->json(['data' => $assignment]);
    }

    public function approve(Request $request, AgencyAssignment $assignment)
    {
        $this->authorize('respondAsAgency', $assignment);

        $assignment = $this->service->agencyApprove($assignment);

        return response()->json(['data' => $assignment]);
    }

    public function decline(Request $request, AgencyAssignment $assignment)
    {
        $this->authorize('respondAsAgency', $assignment);

        $assignment = $this->service->agencyDecline($assignment);

        return response()->json(['data' => $assignment]);
    }

    public function createTrip(Request $request, AgencyAssignment $assignment)
    {
        $this->authorize('view', $assignment);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'items' => 'array',
            'items.*.type' => 'required|string',
            'items.*.id' => 'required|integer',
        ]);

        $trip = $this->service->buildTripForCustomer(
            $assignment, 
            $validated['title'],
            $validated['items'] ?? []
        );

        return response()->json(['data' => $trip], 201);
    }
}
