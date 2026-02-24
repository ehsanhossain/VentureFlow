<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user.
     */
    public function index(Request $request)
    {
        // Paginate notifications
        $notifications = $request->user()->notifications()->paginate(20);

        // ─── Enrich with actor avatars ───────────────────────
        // Collect unique actor names to batch-query employees
        $actorNames = collect($notifications->items())
            ->pluck('data.actor_name')
            ->filter()
            ->unique()
            ->values();

        // Build a name → avatar_url lookup from the employees table
        $avatarMap = [];
        if ($actorNames->isNotEmpty()) {
            $employees = Employee::query();
            foreach ($actorNames as $name) {
                $parts = explode(' ', trim($name), 2);
                $firstName = $parts[0] ?? '';
                $lastName  = $parts[1] ?? '';
                $employees->orWhere(function ($q) use ($firstName, $lastName) {
                    $q->where('first_name', $firstName)
                      ->where('last_name', $lastName);
                });
            }
            foreach ($employees->get() as $emp) {
                $fullName = trim($emp->first_name . ' ' . $emp->last_name);
                if ($emp->image) {
                    $avatarMap[$fullName] = asset('storage/' . $emp->image);
                }
            }
        }

        // Inject avatar URLs into notification data
        $enriched = collect($notifications->items())->map(function ($notification) use ($avatarMap) {
            $data = $notification->data;
            $actorName = $data['actor_name'] ?? null;
            if ($actorName && isset($avatarMap[$actorName]) && empty($data['actor_avatar'])) {
                $data['actor_avatar'] = $avatarMap[$actorName];
                $notification->data = $data;
            }
            return $notification;
        });

        return response()->json([
            'data' => $enriched->values(),
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
