<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\Account\User;
use App\Models\System\Notification;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Using cursor pagination for O(1) performance
        $notifications = $user->notifications()->latest()->cursorPaginate(15);

        // Fetch cached unread count or compute it
        $unreadCount = Cache::remember(
            "user:{$user->id}:unread_notifications",
            now()->addHours(1),
            fn () => $user->notifications()->whereNull('read_at')->count()
        );

        return ApiResponse::success($notifications, 'Notifications retrieved', 200, [
            'meta' => [
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    public function markAsRead(Request $request, Notification $notification)
    {
        if ($notification->notifiable_id !== $request->user()->id || $notification->notifiable_type !== User::class) {
            return ApiResponse::fail('Unauthorized', 'unauthorized', 403);
        }

        if (is_null($notification->read_at)) {
            $notification->markAsRead();

            // Decrement cache safely
            Cache::decrement("user:{$request->user()->id}:unread_notifications");
        }

        return ApiResponse::success($notification, 'Notification marked as read');
    }

    public function markAllAsRead(Request $request)
    {
        $user = $request->user();

        $user->unreadNotifications->markAsRead();

        Cache::put("user:{$user->id}:unread_notifications", 0, now()->addHours(1));

        return ApiResponse::success(null, 'All notifications marked as read');
    }
}
