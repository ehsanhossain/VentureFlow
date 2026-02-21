<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use App\Models\FeeTier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FeeTierController extends Controller
{
    /**
     * Display a listing of fee tiers.
     */
    public function index(Request $request): JsonResponse
    {
        $type = $request->query('type');

        $query = FeeTier::orderBy('order_index');

        if ($type && in_array($type, ['investor', 'target'])) {
            $query->where('fee_type', $type);
        }

        return response()->json($query->get());
    }

    /**
     * Bulk update fee tiers for a given type (transactional delete + recreate).
     */
    public function updateBulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:investor,target',
            'tiers' => 'required|array',
            'tiers.*.min_amount' => 'required|numeric|min:0',
            'tiers.*.max_amount' => 'nullable|numeric|min:0',
            'tiers.*.success_fee_fixed' => 'nullable|numeric|min:0',
            'tiers.*.success_fee_rate' => 'nullable|numeric|min:0|max:100',
            'tiers.*.retainer_details' => 'nullable|string',
            'tiers.*.fee_constraints' => 'nullable|string',
            'tiers.*.order_index' => 'sometimes|integer|min:0',
        ]);

        try {
            \DB::beginTransaction();

            // Delete all existing tiers for this type
            FeeTier::where('fee_type', $validated['type'])->delete();

            // Create new tiers
            foreach ($validated['tiers'] as $index => $tierData) {
                FeeTier::create([
                    'fee_type' => $validated['type'],
                    'min_amount' => $tierData['min_amount'],
                    'max_amount' => $tierData['max_amount'] ?? null,
                    'success_fee_fixed' => $tierData['success_fee_fixed'] ?? null,
                    'success_fee_rate' => $tierData['success_fee_rate'] ?? null,
                    'retainer_details' => $tierData['retainer_details'] ?? null,
                    'fee_constraints' => $tierData['fee_constraints'] ?? null,
                    'order_index' => $tierData['order_index'] ?? $index,
                    'is_active' => true,
                ]);
            }

            \DB::commit();

            return response()->json(['message' => 'Fee tiers updated successfully']);
        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json([
                'message' => 'Failed to update fee tiers',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
