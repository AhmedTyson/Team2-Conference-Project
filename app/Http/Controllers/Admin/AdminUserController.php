<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Services\UserService;

class AdminUserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public function index()
    {
        $users = $this->userService->getAdminList();
        return UserResource::collection($users);
    }

    public function show(int $id)
    {
        $user = $this->userService->showAdmin($id);
        return new UserResource($user);
    }

    public function store(StoreUserRequest $request)
    {
        $user = $this->userService->store($request->validated());
        return new UserResource($user);
    }

    public function update(UpdateUserRequest $request, int $id)
    {
        $user = $this->userService->update($id, $request->validated());
        return new UserResource($user);
    }

    public function active(int $id)
    {
        $user = $this->userService->setActive($id);
        return new UserResource($user);
    }

    public function block(int $id)
    {
        $user = $this->userService->setBlock($id);
        return new UserResource($user);
    }
}
