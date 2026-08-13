<?php

namespace App\Services\Account;

use App\Interfaces\Account\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;

class UserService
{
    protected $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function getAdminList()
    {
        return $this->userRepository->getAllForAdmin();
    }

    public function showAdmin($id)
    {
        return $this->userRepository->findById($id, ['trips', 'reviews', 'subscriptions']);
    }

    public function store(array $data)
    {
        $userData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_active' => $data['is_active'] ?? 1,
            // Admin-created accounts are vouched for by the admin — skip email verification.
            'email_verified_at' => now(),
        ];

        return $this->userRepository->create($userData);
    }

    public function update($id, array $data)
    {
        $user = $this->userRepository->findById($id);

        return $this->userRepository->update($user, $data);
    }

    public function setActive($id)
    {
        $user = $this->userRepository->findById($id);

        return $this->userRepository->update($user, ['is_active' => 1]);
    }

    public function setBlock($id)
    {
        $user = $this->userRepository->findById($id);

        return $this->userRepository->update($user, ['is_active' => 0]);
    }
}
