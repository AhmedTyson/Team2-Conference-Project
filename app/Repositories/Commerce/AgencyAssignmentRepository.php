<?php

namespace App\Repositories\Commerce;

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

    public function getForAgency(int $agencyId): Collection
    {
        return AgencyAssignment::where('agency_user_id', $agencyId)->get();
    }
}
