<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index()
    {
        return new UserResource(User::all());
    }

    public function store(Request $request)
    {
        $users= User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'is_active' => $request->is_active ?? 1,
        ]);
    } 
}
