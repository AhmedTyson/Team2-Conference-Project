<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;

class AdminUserController extends Controller
{
    public function index()
    {
        $users = User::with(['roles'])->latest()->paginate(15);
        return UserResource::collection($users);
    }

    public function show(User $user)
    {
        $user->loadMissing(['trips', 'bookings', 'reviews']);
        return new UserResource($user);
    }

    public function store(StoreUserRequest $request)
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_active' => $request->is_active ?? 1,
        ]);

        return new UserResource($user);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $user->update($request->validated());

        return new UserResource($user);
    }

    public function active(User $user)
    {
        $user->update(['is_active' => 1]);

        return new UserResource($user->fresh());
    }

    public function block(User $user)
    {
        $user->update(['is_active' => 0]);

        return new UserResource($user->fresh());
    }
}