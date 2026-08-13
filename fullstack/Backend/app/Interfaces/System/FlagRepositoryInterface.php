<?php

namespace App\Interfaces\System;

use App\Models\System\Flag;
use Illuminate\Database\Eloquent\Collection;

interface FlagRepositoryInterface
{
    public function create(array $data): Flag;

    public function update(Flag $flag, array $data): bool;

    public function delete(Flag $flag): bool;

    public function getAll(): Collection;

    public function getById(Flag $flag): Flag;
}
