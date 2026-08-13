<?php

namespace App\Interfaces\Account;

use App\Models\Account\User;
use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryInterface
{
    public function getAllForAdmin(): Collection;

    public function findById($id, array $relations = []): User;

    public function create(array $data): User;

    public function update(User $user, array $data): User;
}
