<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ActivityLogController extends Controller
{
    /**
     * Get activity logs for an entity
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'entity_id' => 'required',
            'entity_type' => 'required|in:buyer,seller,deal',
        ]);

        $typeMap = [
            'buyer' => \App\Models\Investor::class,
            'seller' => \App\Models\Target::class,
            'deal' => \App\Models\Deal::class,
        ];

        $logs = ActivityLog::with(['user.employee'])
            ->where('loggable_id', $request->entity_id)
            ->where('loggable_type', $typeMap[$request->entity_type])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $logs->map(function ($log) {
                return [
                    'id' => $log->id,
                    'type' => $log->type,
                    'user' => $log->user->employee 
                        ? $log->user->employee->first_name . ' ' . $log->user->employee->last_name 
                        : $log->user->name,
                    'avatar' => $log->user->employee && $log->user->employee->image 
                        ? url('/api/files/' . $log->user->employee->image) 
                        : null,
                    'content' => $log->content,
                    'timestamp' => $log->created_at,
                    'metadata' => $log->metadata,
                ];
            })
        ]);
    }

    /**
     * Store a new comment
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entity_id' => 'required',
            'entity_type' => 'required|in:buyer,seller,deal',
            'content' => 'required|string',
            'type' => 'nullable|in:comment,system',
        ]);

        $typeMap = [
            'buyer' => \App\Models\Investor::class,
            'seller' => \App\Models\Target::class,
            'deal' => \App\Models\Deal::class,
        ];

        $log = ActivityLog::create([
            'user_id' => Auth::id(),
            'loggable_id' => $validated['entity_id'],
            'loggable_type' => $typeMap[$validated['entity_type']],
            'type' => $validated['type'] ?? 'comment',
            'content' => $validated['content'],
            'metadata' => $request->metadata,
        ]);

        return response()->json([
            'message' => 'Comment added successfully',
            'data' => [
                'id' => $log->id,
                'type' => $log->type,
                'user' => Auth::user()->employee 
                    ? Auth::user()->employee->first_name . ' ' . Auth::user()->employee->last_name 
                    : Auth::user()->name,
                'content' => $log->content,
                'timestamp' => $log->created_at,
            ]
        ], 201);
    }

    /**
     * Delete an activity log
     */
    public function destroy($id): JsonResponse
    {
        $log = ActivityLog::find($id);

        if (!$log) {
            return response()->json([
                'message' => 'Activity log not found'
            ], 404);
        }

        // Only allow the owner or admin to delete
        if ($log->user_id !== Auth::id() && !Auth::user()->hasRole('System Admin')) {
            return response()->json([
                'message' => 'Unauthorized to delete this activity log'
            ], 403);
        }

        $log->delete();

        return response()->json([
            'message' => 'Activity log deleted successfully'
        ]);
    }
}
