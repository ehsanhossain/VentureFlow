<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Display a listing of audit logs (admin only).
     */
    public function index(Request $request)
    {
        // Check if user is admin
        $user = auth()->user();
        if (!$user->hasRole('System Admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = AuditLog::with('user:id,name,email')
            ->orderBy('performed_at', 'desc');

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('performed_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('performed_at', '<=', $request->end_date);
        }

        // Filter by user type (staff/partner)
        if ($request->has('user_type') && $request->user_type) {
            $query->where('user_type', $request->user_type);
        }

        // Filter by action type
        if ($request->has('action') && $request->action) {
            $query->where('action', $request->action);
        }

        // Filter by specific user
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Search in description or entity name
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('entity_name', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = $request->get('per_page', 25);
        $logs = $query->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Get audit log actions summary.
     */
    public function actionsSummary(Request $request)
    {
        $user = auth()->user();
        if (!$user->hasRole('System Admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $actions = AuditLog::select('action')
            ->selectRaw('count(*) as count')
            ->groupBy('action')
            ->orderByDesc('count')
            ->get();

        return response()->json($actions);
    }

    /**
     * Get recent activity for a specific user.
     */
    public function userActivity(Request $request, int $userId)
    {
        $user = auth()->user();
        if (!$user->hasRole('System Admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $logs = AuditLog::where('user_id', $userId)
            ->orderBy('performed_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json(['data' => $logs]);
    }
}
