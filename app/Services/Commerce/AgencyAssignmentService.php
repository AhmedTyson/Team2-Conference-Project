<?php

namespace App\Services\Commerce;

use App\Enums\AgencyAssignmentStatus;
use App\Enums\TripStatus;
use App\Events\Commerce\AgencyAssignmentAdminApproved;
use App\Events\Commerce\AgencyAssignmentApproved;
use App\Events\Commerce\AgencyAssignmentDeclined;
use App\Interfaces\Commerce\AgencyAssignmentRepositoryInterface;
use App\Models\Commerce\AgencyAssignment;
use App\Models\Trips\Trip;
use Illuminate\Support\Facades\DB;

class AgencyAssignmentService
{
    public function __construct(
        private AgencyAssignmentRepositoryInterface $repository
    ) {}

    public function requestAssignment(int $customerId, ?string $budgetLevel = null): AgencyAssignment
    {
        return $this->repository->create([
            'customer_id' => $customerId,
            'budget_level' => $budgetLevel,
            'status' => AgencyAssignmentStatus::REQUESTED,
        ]);
    }

    public function adminApprove(AgencyAssignment $assignment, int $adminId, int $agencyUserId): AgencyAssignment
    {
        $this->repository->update($assignment, [
            'status' => AgencyAssignmentStatus::ADMIN_APPROVED,
            'admin_id' => $adminId,
            'agency_user_id' => $agencyUserId,
            'admin_approved_at' => now(),
        ]);

        event(new AgencyAssignmentAdminApproved($assignment));

        return $assignment;
    }

    public function agencyApprove(AgencyAssignment $assignment): AgencyAssignment
    {
        $this->repository->update($assignment, [
            'status' => AgencyAssignmentStatus::AGENCY_APPROVED,
            'agency_responded_at' => now(),
        ]);

        event(new AgencyAssignmentApproved($assignment));

        return $assignment;
    }

    public function agencyDecline(AgencyAssignment $assignment): AgencyAssignment
    {
        $this->repository->update($assignment, [
            'status' => AgencyAssignmentStatus::AGENCY_DECLINED,
            'agency_responded_at' => now(),
        ]);

        event(new AgencyAssignmentDeclined($assignment));

        return $assignment;
    }

    public function buildTripForCustomer(AgencyAssignment $assignment, string $title, array $items = []): Trip
    {
        return DB::transaction(function () use ($assignment, $title, $items) {
            $trip = Trip::create([
                'user_id' => $assignment->customer_id,
                'agency_assignment_id' => $assignment->id,
                'title' => $title,
                'status' => TripStatus::PENDING,
            ]);

            foreach ($items as $item) {
                // morphByMany format: [id => ['notes' => '...']]
                // Expecting array format: ['type' => 'App\Models\Catalog\Hotel', 'id' => 1]
                $class = $item['type'];
                $id = $item['id'];
                
                $trip->{$this->getRelationName($class)}()->attach($id);
            }

            return $trip;
        });
    }

    private function getRelationName(string $class): string
    {
        return match($class) {
            \App\Models\Catalog\Hotel::class => 'hotels',
            \App\Models\Catalog\Flight::class => 'flights',
            \App\Models\Catalog\Restaurant::class => 'restaurants',
            \App\Models\Catalog\Attraction::class => 'attractions',
            \App\Models\Catalog\Destination::class => 'destinations',
            default => throw new \Exception("Unsupported type")
        };
    }
}
