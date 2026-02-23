<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\AuditLog;

class AuthController extends Controller
{

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required',
            'password' => 'required',
        ]);

        $input = $request->email;
        $credentials = ['password' => $request->password];

        if (filter_var($input, FILTER_VALIDATE_EMAIL)) {
            $credentials['email'] = $input;
        } else {
            // Attempt to resolve Partner ID to User Email
            $partner = \App\Models\Partner::where('partner_id', $input)->first();
            if ($partner && $partner->user_id) {
                $user = \App\Models\User::find($partner->user_id);
                if ($user) {
                    $credentials['email'] = $user->email;
                } else {
                     return response()->json(['message' => 'Unauthorized'], 401);
                }
            } else {
                // If not an email and not found as Partner ID, it will fail auth
                $credentials['email'] = $input;
            }
        }

        if (!Auth::attempt($credentials, true)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user = Auth::user();

        // Reject deactivated accounts
        if (isset($user->is_active) && !$user->is_active) {
            Auth::logout();
            return response()->json(['message' => 'Your account has been deactivated. Please contact your administrator.'], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        // Check if user is a partner
        $role = $user->getRoleNames()->first();
        $isPartner = $role === 'partner' || $user->is_partner;

        // Log the login action
        AuditLog::log(
            'login',
            $user->id,
            $isPartner ? 'partner' : ($role === 'System Admin' ? 'admin' : 'staff'),
            'User',
            $user->id,
            $user->name,
            'User logged in successfully'
        );

        return response()->json([
            'user' => $user,
            'role' => $role,
            'is_partner' => $isPartner,
            'token' => $token
        ]);
    }

    public function user(Request $request) {
        $user = $request->user();
        $employee = \App\Models\Employee::where('user_id', $user->id)->first();
        $partner = \App\Models\Partner::with('partnerOverview')->where('user_id', $user->id)->first();
        $role = $user->getRoleNames()->first();
        $isPartner = $role === 'partner' || $user->is_partner === true;
        
        return response()->json([
            'user' => $user,
            'role' => $role,
            'is_partner' => $isPartner,
            'employee' => $employee,
            'partner' => $partner
        ]);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();
        
        // If current_password is provided, verify it
        if ($request->has('current_password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json(['message' => 'Current password is incorrect'], 422);
            }
        }
        
        $request->validate([
            'password' => 'required|min:8',
        ]);

        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->save();

        // Log the password change
        AuditLog::log(
            'password_change',
            $user->id,
            null,
            'User',
            $user->id,
            $user->name,
            'User changed their password'
        );

        return response()->json(['message' => 'Password changed successfully']);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        
        // Log the logout action
        if ($user) {
            AuditLog::log(
                'logout',
                $user->id,
                null,
                'User',
                $user->id,
                $user->name,
                'User logged out'
            );
        }

        if ($request->bearerToken()) {
            $user->tokens()->delete();
            return response()->json(['message' => 'Logged out successfully (Token Revoked)']);
        }


        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully (Session Ended)']);
    }
}
