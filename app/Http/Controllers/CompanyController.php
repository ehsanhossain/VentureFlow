<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class CompanyController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Company::latest()->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name'     => 'required|string|max:255',
                'industry' => 'nullable|string|max:255',
                'address'  => 'nullable|string|max:500',
                'website'  => 'nullable|url|max:255',
                'email'    => 'nullable|email|max:255',
            ]);

            $company = Company::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Company created successfully',
                'data'    => $company,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors'  => $e->errors(),
            ], 422);
        }
    }

    public function show(Company $company): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $company,
        ]);
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name'     => 'required|string|max:255',
                'industry' => 'nullable|string|max:255',
                'address'  => 'nullable|string|max:500',
                'website'  => 'nullable|url|max:255',
                'email'    => 'nullable|email|max:255',
            ]);

            $company->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Company updated successfully',
                'data'    => $company,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors'  => $e->errors(),
            ], 422);
        }
    }

    public function destroy(Company $company): JsonResponse
    {
        $company->delete();

        return response()->json([
            'success' => true,
            'message' => 'Company deleted successfully',
        ]);
    }
}

