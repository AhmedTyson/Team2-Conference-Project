<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
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

        return response()->json([
            'success' => true,
            'message' => 'Platform notifications retrieved successfully',
            'data' => $query->paginate(20)
        ]);
    }
}
