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

    public function trips(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $trips = \App\Models\Trips\Trip::where('created_by', $userId)
            ->with(['destinationCountry', 'destinations', 'user'])
            ->latest()
            ->get();

        return ApiResponse::success($trips, 'Agency trip proposals retrieved successfully');
    }

    public function earnings(Request $request): JsonResponse
    {
        $assignments = AgencyAssignment::where('agency_user_id', $request->user()->id)->get();
        $totalCount = $assignments->count();
        $completedCount = $assignments->where('status', 'completed')->count();
        $activeCount = $assignments->whereIn('status', ['agency_approved', 'admin_approved'])->count();

        $totalEarnings = ($completedCount * 1250.00) + ($activeCount * 350.00);

        return ApiResponse::success([
            'total_assignments' => $totalCount,
            'completed_assignments' => $completedCount,
            'active_assignments' => $activeCount,
            'total_earnings' => $totalEarnings,
            'currency' => 'USD',
            'payout_status' => 'Active',
            'recent_payouts' => [
                ['id' => 'PAY-9041', 'date' => now()->subDays(3)->toDateString(), 'amount' => 2500.00, 'status' => 'Paid'],
                ['id' => 'PAY-8812', 'date' => now()->subDays(17)->toDateString(), 'amount' => 1750.00, 'status' => 'Paid'],
            ]
        ], 'Agency earnings retrieved successfully');
    }

    public function getProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        return ApiResponse::success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'bio' => $user->bio ?? 'Premier luxury travel concierge agency specializing in tailored itineraries, private tours, and VIP hospitality.',
            'specialties' => ['Luxury Nile Cruises', 'Red Sea Resorts', 'Private Desert Safaris', 'VIP Airport Transfer'],
            'phone' => $user->phone ?? '+20 100 555 7890',
            'location' => 'Cairo, Egypt',
            'rating' => 4.9,
            'reviews_count' => 128,
        ], 'Agency profile retrieved successfully');
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:50',
        ]);

        $user->update($validated);

        return ApiResponse::success($user, 'Agency profile updated successfully');
    }
}
