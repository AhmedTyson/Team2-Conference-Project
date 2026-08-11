<?php

namespace App\Interfaces\Commerce;

use App\Models\Commerce\AgencyAssignment;
use Illuminate\Database\Eloquent\Collection;

interface AgencyAssignmentRepositoryInterface
{
public function create(array $data): AgencyAssignment;
    public function update(AgencyAssignment $assignment, array $data): bool;
    public function findById(int $id): ?AgencyAssignment;
    public function getForAgency(int $agencyId): Collection;
    public function getPending(): Collection;
    public function getForCustomer(int $customerId): Collection;
}
