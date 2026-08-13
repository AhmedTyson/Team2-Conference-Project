<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\System\Notification;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Notification::with('user:id,name,email')->latest();

        if ($request->has('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        $notifications = $query->paginate(20);

        return ApiResponse::success($notifications, 'Platform notifications retrieved successfully', 200, [
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'last_page' => $notifications->lastPage(),
            ],
        ]);
    }
}
