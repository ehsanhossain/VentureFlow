<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user.
     */
    public function index(Request $request)
    {
        // Paginate notifications
        $notifications = $request->user()->notifications()->paginate(20);

        return response()->json([
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'total' => $notifications->total(),
            ]
        ]);
    }

    /**
     * Get unread notification count.
     */
    public function unreadCount(Request $request)
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications()->count()
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read']);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * Delete a specific notification.
     */
    public function destroy(Request $request, $id)
    {
        $notification = $request->user()->notifications()->find($id);
        
        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }
        
        $notification->delete();

        return response()->json(['message' => 'Notification deleted']);
    }
}
