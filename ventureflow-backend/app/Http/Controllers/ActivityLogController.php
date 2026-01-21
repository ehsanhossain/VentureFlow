<?php

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
            'buyer' => \App\Models\Buyer::class,
            'seller' => \App\Models\Seller::class,
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
                        ? asset('storage/' . $log->user->employee->image) 
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
            'buyer' => \App\Models\Buyer::class,
            'seller' => \App\Models\Seller::class,
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
}
