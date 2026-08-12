<?php

namespace App\Interfaces\Commerce;

use App\Models\Commerce\AgencyAssignment;
use Illuminate\Pagination\LengthAwarePaginator;

interface AgencyAssignmentRepositoryInterface
{
    public function create(array $data): AgencyAssignment;
    public function update(AgencyAssignment $assignment, array $data): bool;
    public function findById(int $id): ?AgencyAssignment;
    public function getForAgency(int $agencyId, int $perPage = 15, int $page = 1): LengthAwarePaginator;
    public function getPending(int $perPage = 15, int $page = 1): LengthAwarePaginator;
    public function getForCustomer(int $customerId, int $perPage = 15, int $page = 1): LengthAwarePaginator;
}
