<?php

namespace App\Repositories\System;

use App\Interfaces\System\FlagRepositoryInterface;
use App\Models\System\Flag;
use Illuminate\Database\Eloquent\Collection;

class FlagRepository implements FlagRepositoryInterface
{
    public function create(array $data): Flag
    {
        return Flag::create($data);
    }

    public function update(Flag $flag, array $data): bool
    {
        return $flag->update($data);
    }

    public function delete(Flag $flag): bool
    {
        return (bool) $flag->delete();
    }

    public function getAll(): Collection
    {
        return Flag::with(['reporter', 'reviewer', 'agencyAssignment.customer', 'agencyAssignment.agency'])->latest()->get();
    }

    public function getById(Flag $flag): Flag
    {
        return $flag->load(['reporter', 'reviewer', 'agencyAssignment.customer', 'agencyAssignment.agency']);
    }
}
