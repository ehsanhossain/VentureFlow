<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use App\Models\Designation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class DesignationController extends Controller
{
    /**
     * GET /api/designations
     */
    public function index(): JsonResponse
    {
        $designations = Designation::latest()->get();

        return response()->json([
            'success' => true,
            'data'    => $designations,
        ]);
    }

    /**
     * POST /api/designations
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title'       => 'required|string|max:255',
                'description' => 'nullable|string',
            ]);

            $designation = Designation::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Designation created',
                'data'    => $designation,
            ], 201); // 201 Created
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors'  => $e->errors(),
            ], 422);
        }
    }

    /**
     * GET /api/designations/{designation}
     */
    public function show(Designation $designation): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $designation,
        ]);
    }

    /**
     * PUT /api/designations/{designation}
     */
    public function update(Request $request, Designation $designation): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title'       => 'required|string|max:255',
                'description' => 'nullable|string',
            ]);

            $designation->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Designation updated',
                'data'    => $designation,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors'  => $e->errors(),
            ], 422);
        }
    }

    /**
     * DELETE /api/designations/{designation}
     */
    public function destroy(Designation $designation): JsonResponse
    {
        $designation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Designation deleted',
        ]);
    }
}
