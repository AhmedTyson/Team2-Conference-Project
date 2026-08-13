<?php

namespace App\Repositories\Account;

use App\Interfaces\Account\UserRepositoryInterface;
use App\Models\Account\User;
use Illuminate\Database\Eloquent\Collection;

class UserRepository implements UserRepositoryInterface
{
    public function getAllForAdmin(): Collection
    {
        return User::with(['roles'])->latest()->get();
    }

    public function findById($id, array $relations = []): User
    {
        $query = User::query();
        if (! empty($relations)) {
            $query->with($relations);
        }

        return $query->findOrFail($id);
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);

        return $user;
    }
}
