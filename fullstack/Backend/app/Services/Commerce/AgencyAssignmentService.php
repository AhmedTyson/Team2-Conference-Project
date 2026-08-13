<?php

namespace App\Services\Commerce;

use App\Enums\AgencyAssignmentStatus;
use App\Enums\TripStatus;
use App\Events\Commerce\AgencyAssignmentAdminApproved;
use App\Events\Commerce\AgencyAssignmentApproved;
use App\Events\Commerce\AgencyAssignmentDeclined;
use App\Interfaces\Commerce\AgencyAssignmentRepositoryInterface;
use App\Models\Catalog\Attraction;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Flight;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Restaurant;
use App\Models\Commerce\AgencyAssignment;
use App\Models\Trips\Trip;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Pagination\LengthAwarePaginator;
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

    public function listPendingForAdmin(int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        return $this->repository->getPending($perPage, $page);
    }

    public function listForCustomer(int $customerId, int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        return $this->repository->getForCustomer($customerId, $perPage, $page);
    }

    public function cancel(AgencyAssignment $assignment, int $customerId): AgencyAssignment
    {
        $this->assertStatus($assignment, AgencyAssignmentStatus::REQUESTED, AgencyAssignmentStatus::ADMIN_APPROVED);

        $this->repository->update($assignment, [
            'status' => AgencyAssignmentStatus::CANCELLED,
        ]);

        return $assignment;
    }

    public function adminApprove(AgencyAssignment $assignment, int $adminId, int $agencyUserId): AgencyAssignment
    {
        $this->assertStatus($assignment, AgencyAssignmentStatus::REQUESTED);

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
        $this->assertStatus($assignment, AgencyAssignmentStatus::ADMIN_APPROVED);

        $this->repository->update($assignment, [
            'status' => AgencyAssignmentStatus::AGENCY_APPROVED,
            'agency_responded_at' => now(),
        ]);

        event(new AgencyAssignmentApproved($assignment));

        return $assignment;
    }

    public function agencyDecline(AgencyAssignment $assignment): AgencyAssignment
    {
        $this->assertStatus($assignment, AgencyAssignmentStatus::ADMIN_APPROVED);

        $this->repository->update($assignment, [
            'status' => AgencyAssignmentStatus::AGENCY_DECLINED,
            'agency_responded_at' => now(),
        ]);

        event(new AgencyAssignmentDeclined($assignment));

        return $assignment;
    }

    public function buildTripForCustomer(AgencyAssignment $assignment, string $title, array $items = []): Trip
    {
        $this->assertStatus($assignment, AgencyAssignmentStatus::AGENCY_APPROVED);

        return DB::transaction(function () use ($assignment, $title, $items) {
            $trip = Trip::create([
                'user_id' => $assignment->customer_id,
                'agency_assignment_id' => $assignment->id,
                'title' => $title,
                'travel_style' => 'custom',
                'no_of_travelers' => 1,
                'no_of_days' => 7,
                'budget' => $this->budgetForLevel($assignment->budget_level),
                'start_date' => now()->addDays(7)->toDateString(),
                'end_date' => now()->addDays(14)->toDateString(),
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

    private function budgetForLevel(?string $level): float
    {
        return match ($level) {
            'low' => 5000,
            'medium' => 10000,
            'high' => 20000,
            'luxury' => 50000,
            default => 10000,
        };
    }

    private function assertStatus(AgencyAssignment $assignment, AgencyAssignmentStatus ...$expectedStatuses): void
    {
        if (! in_array($assignment->status, $expectedStatuses)) {
            abort(409, 'Invalid assignment state transition. Current state: '.($assignment->status->value ?? 'unknown'));
        }
    }

    private function getRelationName(string $class): string
    {
        $class = Relation::getMorphedModel($class) ?? $class;

        return match ($class) {
            Hotel::class => 'hotels',
            Flight::class => 'flights',
            Restaurant::class => 'restaurants',
            Attraction::class => 'attractions',
            Destination::class => 'destinations',
            default => throw new \Exception('Unsupported type')
        };
    }
}
