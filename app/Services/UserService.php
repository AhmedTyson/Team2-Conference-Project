<?php

namespace App\Services;

use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;

class UserService
{
    protected $userRepository;

    public function __construct(UserRepository $userRepository)
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
