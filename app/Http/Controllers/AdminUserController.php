<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AdminUserController extends Controller
{
    /**
     * Reset a user's password (admin action).
     * Does NOT reveal the old password — just sets a new one.
     */
    public function resetPassword(Request $request, int $id)
    {
        $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::findOrFail($id);

        // Prevent admin from resetting another admin's password via this endpoint
        if ($user->hasRole('System Admin') && $user->id !== auth()->id()) {
            return response()->json(['message' => 'Cannot reset another administrator\'s password.'], 403);
        }

        $user->update([
            'password'             => Hash::make($request->password),
            'must_change_password' => true, // Force a password change on next login
        ]);

        return response()->json(['message' => 'Password reset successfully. The user will be prompted to change it on next login.']);
    }

    /**
     * Activate or deactivate a user account.
     */
    public function updateStatus(Request $request, int $id)
    {
        $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $user = User::findOrFail($id);

        // Prevent deactivating another admin
        if ($user->hasRole('System Admin') && $user->id !== auth()->id()) {
            return response()->json(['message' => 'Cannot deactivate another administrator.'], 403);
        }

        $user->update(['is_active' => $request->boolean('is_active')]);

        $status = $request->boolean('is_active') ? 'activated' : 'deactivated';

        return response()->json(['message' => "User account {$status} successfully."]);
    }
}
