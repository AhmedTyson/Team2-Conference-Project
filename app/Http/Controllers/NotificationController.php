<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Using cursor pagination for O(1) performance
        $notifications = $user->notifications()->latest()->cursorPaginate(15);

        // Fetch cached unread count or compute it
        $unreadCount = \Illuminate\Support\Facades\Cache::remember(
            "user:{$user->id}:unread_notifications",
            now()->addHours(1),
            fn () => $user->notifications()->whereNull('read_at')->count()
        );

        return response()->json([
            'success' => true,
            'message' => 'Notifications retrieved',
            'data' => $notifications,
            'meta' => [
                'unread_count' => $unreadCount
            ]
        ]);
    }

    public function markAsRead(Request $request, Notification $notification)
    {
        if ($notification->notifiable_id !== $request->user()->id || $notification->notifiable_type !== \App\Models\User::class) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if (is_null($notification->read_at)) {
            $notification->markAsRead();
            
            // Decrement cache safely
            \Illuminate\Support\Facades\Cache::decrement("user:{$request->user()->id}:unread_notifications");
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
            'data' => $notification
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        
        $user->unreadNotifications->markAsRead();
        
        \Illuminate\Support\Facades\Cache::put("user:{$user->id}:unread_notifications", 0, now()->addHours(1));

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }
}
