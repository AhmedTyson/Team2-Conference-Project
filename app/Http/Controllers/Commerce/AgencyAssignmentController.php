<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\AgencyAssignment;
use App\Services\Commerce\AgencyAssignmentService;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class AgencyAssignmentController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private AgencyAssignmentService $service) {}

    public function index(Request $request)
    {
        $assignments = AgencyAssignment::where('agency_user_id', $request->user()->id)
            ->with(['customer', 'trips'])
            ->get();

        return ApiResponse::success($assignments, 'Agency assignments retrieved successfully');
    }

    public function myAssignments(Request $request)
    {
        $assignments = $this->service->listForCustomer($request->user()->id);

        return ApiResponse::success($assignments->items(), 'Agency assignments retrieved successfully', 200, [
            'meta' => [
                'current_page' => $assignments->currentPage(),
                'per_page' => $assignments->perPage(),
                'total' => $assignments->total(),
                'last_page' => $assignments->lastPage(),
                'from' => $assignments->firstItem(),
                'to' => $assignments->lastItem(),
            ],
        ]);
    }

    public function cancel(Request $request, AgencyAssignment $assignment)
    {
        $this->authorize('cancel', $assignment);

        $assignment = $this->service->cancel($assignment, $request->user()->id);

        return ApiResponse::success($assignment, 'Agency assignment cancelled successfully');
    }

    public function approve(Request $request, AgencyAssignment $assignment)
    {
        $this->authorize('respondAsAgency', $assignment);

        $assignment = $this->service->agencyApprove($assignment);

        return ApiResponse::success($assignment, 'Agency assignment approved successfully');
    }

    public function decline(Request $request, AgencyAssignment $assignment)
    {
        $this->authorize('respondAsAgency', $assignment);

        $assignment = $this->service->agencyDecline($assignment);

        return ApiResponse::success($assignment, 'Agency assignment declined successfully');
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

        return ApiResponse::success($trip, 'Trip created successfully', 201);
    }
}
