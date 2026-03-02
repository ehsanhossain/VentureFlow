<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class TeamController extends Controller
{



    public function index(): JsonResponse
    {
        $teams = Team::latest()->get();

        return response()->json([
            'success' => true,
            'data'    => $teams,
        ]);
    }




    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name'        => 'required|string|max:255',
                'description' => 'nullable|string',
            ]);

            $team = Team::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Team created successfully',
                'data'    => $team,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors'  => $e->errors(),
            ], 422);
        }
    }




    public function show(Team $team): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $team,
        ]);
    }




    public function update(Request $request, Team $team): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name'        => 'required|string|max:255',
                'description' => 'nullable|string',
            ]);

            $team->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Team updated successfully',
                'data'    => $team,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors'  => $e->errors(),
            ], 422);
        }
    }




    public function destroy(Team $team): JsonResponse
    {
        $team->delete();

        return response()->json([
            'success' => true,
            'message' => 'Team deleted successfully',
        ]);
    }
}
