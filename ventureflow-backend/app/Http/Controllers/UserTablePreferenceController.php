<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use App\Models\UserTablePreference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserTablePreferenceController extends Controller
{
    /**
     * Get user's saved table preference for a given table type.
     * Returns the preference or null (so frontend falls back to system defaults).
     */
    public function show(string $tableType)
    {
        if (!in_array($tableType, ['investor', 'target'])) {
            return response()->json(['error' => 'Invalid table type'], 422);
        }

        $pref = UserTablePreference::where('user_id', Auth::id())
            ->where('table_type', $tableType)
            ->first();

        if (!$pref) {
            return response()->json(null);
        }

        return response()->json([
            'visible_columns' => $pref->visible_columns,
            'column_order'    => $pref->column_order,
            'updated_at'      => $pref->updated_at->toISOString(),
        ]);
    }

    /**
     * Save or update user's table preference.
     */
    public function update(Request $request, string $tableType)
    {
        if (!in_array($tableType, ['investor', 'target'])) {
            return response()->json(['error' => 'Invalid table type'], 422);
        }

        $validated = $request->validate([
            'visible_columns' => 'required|array',
            'visible_columns.*' => 'string',
            'column_order'    => 'required|array',
            'column_order.*'  => 'string',
        ]);

        $pref = UserTablePreference::updateOrCreate(
            [
                'user_id'    => Auth::id(),
                'table_type' => $tableType,
            ],
            [
                'visible_columns' => $validated['visible_columns'],
                'column_order'    => $validated['column_order'],
            ]
        );

        return response()->json([
            'visible_columns' => $pref->visible_columns,
            'column_order'    => $pref->column_order,
            'updated_at'      => $pref->updated_at->toISOString(),
        ]);
    }

    /**
     * Delete user's table preference (reset to system default).
     */
    public function destroy(string $tableType)
    {
        if (!in_array($tableType, ['investor', 'target'])) {
            return response()->json(['error' => 'Invalid table type'], 422);
        }

        UserTablePreference::where('user_id', Auth::id())
            ->where('table_type', $tableType)
            ->delete();

        return response()->json(['message' => 'Preference reset to default']);
    }
}
