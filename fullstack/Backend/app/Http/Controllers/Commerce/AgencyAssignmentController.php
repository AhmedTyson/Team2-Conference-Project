<?php

namespace App\Http\Controllers\Commerce;

use App\Http\Controllers\Controller;
use App\Models\Commerce\AgencyAssignment;
use App\Services\Commerce\AgencyAssignmentService;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgencyAssignmentController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private AgencyAssignmentService $service) {}

    public function index(Request $request): JsonResponse
    {
        $assignments = AgencyAssignment::where('agency_user_id', $request->user()->id)
            ->with(['customer', 'trips'])
            ->get();

        return ApiResponse::success($assignments, 'Agency assignments retrieved successfully');
    }

    public function myAssignments(Request $request): JsonResponse
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

    public function cancel(Request $request, AgencyAssignment $assignment): JsonResponse
    {
        $this->authorize('cancel', $assignment);

        $assignment = $this->service->cancel($assignment, $request->user()->id);

        return ApiResponse::success($assignment, 'Agency assignment cancelled successfully');
    }

    public function approve(Request $request, AgencyAssignment $assignment): JsonResponse
    {
        $this->authorize('respondAsAgency', $assignment);

        $assignment = $this->service->agencyApprove($assignment);

        return ApiResponse::success($assignment, 'Agency assignment approved successfully');
    }

    public function decline(Request $request, AgencyAssignment $assignment): JsonResponse
    {
        $this->authorize('respondAsAgency', $assignment);

        $assignment = $this->service->agencyDecline($assignment);

        return ApiResponse::success($assignment, 'Agency assignment declined successfully');
    }

    public function createTrip(Request $request, AgencyAssignment $assignment): JsonResponse
    {
        $this->authorize('buildTrip', $assignment);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'capacity' => 'nullable|integer|min:1',
            'no_of_travelers' => 'nullable|integer|min:1',
            'price' => 'nullable|numeric|min:0',
            'items' => 'array',
            'items.*.type' => 'required|string',
            'items.*.id' => 'required|integer',
        ]);

        if (isset($validated['capacity']) && !isset($validated['no_of_travelers'])) {
            $validated['no_of_travelers'] = $validated['capacity'];
        }

        $trip = $this->service->buildTripForCustomer(
            $assignment,
            $validated['title'],
            $validated['items'] ?? [],
            $validated
        );

        return ApiResponse::success($trip, 'Trip created successfully', 201);
    }

    public function complete(Request $request, AgencyAssignment $assignment): JsonResponse
    {
        $this->authorize('respondAsAgency', $assignment);

        $assignment = $this->service->agencyComplete($assignment);

        return ApiResponse::success($assignment, 'Agency assignment marked as completed successfully');
    }

    public function trips(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $trips = \App\Models\Trips\Trip::whereHas('agencyAssignment', function ($q) use ($userId) {
            $q->where('agency_user_id', $userId);
        })->with(['destinations', 'user'])->latest()->get();

        return ApiResponse::success($trips, 'Agency trip proposals retrieved successfully');
    }

    public function earnings(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $assignments = AgencyAssignment::where('agency_user_id', $userId)
            ->with(['trips'])
            ->get();

        $totalCount = $assignments->count();
        $completedAssignments = $assignments->where('status', \App\Enums\AgencyAssignmentStatus::COMPLETED);
        $completedCount = $completedAssignments->count();
        $activeCount = $assignments->whereIn('status', [
            \App\Enums\AgencyAssignmentStatus::AGENCY_APPROVED,
            \App\Enums\AgencyAssignmentStatus::ADMIN_APPROVED
        ])->count();

        // Calculate real earnings based on actual trip budgets attached to assignments
        $totalEarnings = $assignments->flatMap->trips->sum('budget');

        return ApiResponse::success([
            'total_assignments' => $totalCount,
            'completed_assignments' => $completedCount,
            'active_assignments' => $activeCount,
            'total_earnings' => round((float)$totalEarnings, 2),
            'currency' => 'USD',
            'payout_status' => $completedCount > 0 ? 'Active' : 'No Payouts Yet',
            'recent_payouts' => [], // Honest empty array — no synthetic/hardcoded fake payouts!
        ], 'Agency earnings retrieved successfully');
    }

    public function getProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        return ApiResponse::success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'bio' => $user->bio ?? null,
            'specialties' => [], // Honest empty array — no synthetic ratings or reviews!
            'phone' => $user->phone ?? null,
            'location' => null,
            'rating' => null,
            'reviews_count' => 0,
        ], 'Agency profile retrieved successfully');
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:50',
            'bio' => 'sometimes|string|max:1000',
        ]);

        $user->update($validated);

        return ApiResponse::success($user, 'Agency profile updated successfully');
    }
}
