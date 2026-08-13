<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\AgencyAssignment;
use App\Services\Commerce\AgencyAssignmentService;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class AdminAgencyController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private AgencyAssignmentService $service) {}

    public function adminIndex(): JsonResponse
    {
        $page = request('page', 1);
        $perPage = request('per_page', 15);

        $pending = $this->service->listPendingForAdmin($perPage, $page);

        return ApiResponse::success($pending->items(), 'Pending agency assignments retrieved successfully', 200, [
            'pagination' => [
                'current_page' => $pending->currentPage(),
                'per_page' => $pending->perPage(),
                'total' => $pending->total(),
                'last_page' => $pending->lastPage(),
                'from' => $pending->firstItem(),
                'to' => $pending->lastItem(),
            ],
        ]);
    }

    public function approve(Request $request, AgencyAssignment $assignment): JsonResponse
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

        return ApiResponse::success($assignment, 'Agency assignment approved successfully');
    }
}
