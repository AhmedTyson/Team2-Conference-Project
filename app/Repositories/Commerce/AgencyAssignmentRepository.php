<?php

namespace App\Repositories\Commerce;

use App\Enums\AgencyAssignmentStatus;
use App\Interfaces\Commerce\AgencyAssignmentRepositoryInterface;
use App\Models\Commerce\AgencyAssignment;
use Illuminate\Database\Eloquent\Collection;

class AgencyAssignmentRepository implements AgencyAssignmentRepositoryInterface
{
    public function create(array $data): AgencyAssignment
    {
        return AgencyAssignment::create($data);
    }

    public function update(AgencyAssignment $assignment, array $data): bool
    {
        return $assignment->update($data);
    }

    public function findById(int $id): ?AgencyAssignment
    {
        return AgencyAssignment::find($id);
    }

    public function getForAgency(int $agencyId, int $perPage = 15, int $page = 1): \Illuminate\Pagination\LengthAwarePaginator
    {
        return AgencyAssignment::where('agency_user_id', $agencyId)
            ->with(['customer'])
            ->latest()
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function getPending(int $perPage = 15, int $page = 1): \Illuminate\Pagination\LengthAwarePaginator
    {
        return AgencyAssignment::where('status', AgencyAssignmentStatus::REQUESTED)
            ->with(['customer', 'agency'])
            ->latest()
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function getForCustomer(int $customerId, int $perPage = 15, int $page = 1): \Illuminate\Pagination\LengthAwarePaginator
    {
        return AgencyAssignment::where('customer_id', $customerId)
            ->with(['agency', 'admin', 'trips'])
            ->latest()
            ->paginate($perPage, ['*'], 'page', $page);
    }
}
