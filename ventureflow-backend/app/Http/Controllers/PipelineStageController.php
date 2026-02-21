<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Http\Controllers;

use App\Models\PipelineStage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PipelineStageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $type = $request->query('type');
        $includeInactive = $request->query('include_inactive', false);
        
        $query = PipelineStage::orderBy('order_index');
        
        if (!$includeInactive) {
            $query->where('is_active', true);
        }
        
        if ($type && in_array($type, ['buyer', 'seller'])) {
            $query->where('pipeline_type', $type);
        }
        
        return response()->json($query->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pipeline_type' => 'required|in:buyer,seller',
            'code' => 'required|string|max:2',
            'name' => 'required|string|max:255',
            'progress' => 'required|integer|min:0|max:100',
            'order_index' => 'required|integer',
        ]);

        $stage = PipelineStage::create($validated);

        return response()->json($stage, 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PipelineStage $pipelineStage): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|max:2',
            'name' => 'sometimes|string|max:255',
            'progress' => 'sometimes|integer|min:0|max:100',
            'order_index' => 'sometimes|integer',
            'is_active' => 'sometimes|boolean',
        ]);

        $pipelineStage->update($validated);

        return response()->json($pipelineStage);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PipelineStage $pipelineStage): JsonResponse
    {
        $pipelineStage->delete();
        return response()->json(null, 204);
    }

    /**
     * Update multiple stages at once
     */
    public function updateBulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:buyer,seller',
            'stages' => 'required|array',
            'stages.*.code' => 'required|string|max:2',
            'stages.*.name' => 'required|string|max:255',
            'stages.*.progress' => 'required|integer|min:0|max:100',
            'stages.*.order_index' => 'required|integer|min:0',
            'stages.*.gate_rules' => 'nullable|array',
            'stages.*.gate_rules.*.field' => 'required_with:stages.*.gate_rules|string',
            'stages.*.gate_rules.*.operator' => 'required_with:stages.*.gate_rules|string',
            'stages.*.gate_rules.*.value' => 'nullable',
            'stages.*.monetization_config' => 'nullable|array',
            'stages.*.monetization_config.enabled' => 'nullable|boolean',
            'stages.*.monetization_config.type' => 'nullable|in:one_time,monthly',
            'stages.*.monetization_config.payment_name' => 'nullable|string|max:255',
            'stages.*.monetization_config.amount' => 'nullable|numeric|min:0',
            'stages.*.monetization_config.deduct_from_success_fee' => 'nullable|boolean',
        ]);

        try {
            \DB::beginTransaction();

            // Delete all existing stages for this type
            PipelineStage::where('pipeline_type', $validated['type'])->delete();

            // Create new stages
            foreach ($validated['stages'] as $index => $stageData) {
                PipelineStage::create([
                    'pipeline_type' => $validated['type'],
                    'code' => $stageData['code'],
                    'name' => $stageData['name'],
                    'progress' => $stageData['progress'],
                    'order_index' => $stageData['order_index'] ?? $index,
                    'is_active' => true,
                    'gate_rules' => $stageData['gate_rules'] ?? null,
                    'monetization_config' => $stageData['monetization_config'] ?? null,
                ]);
            }

            \DB::commit();

            return response()->json(['message' => 'Stages updated successfully']);
        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json([
                'message' => 'Failed to update stages',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
