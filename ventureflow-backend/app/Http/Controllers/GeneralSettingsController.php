<?php

namespace App\Http\Controllers;

use App\Models\GeneralSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GeneralSettingsController extends Controller
{
    /**
     * Get all general settings as key-value pairs.
     */
    public function index(): JsonResponse
    {
        $settings = GeneralSetting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    /**
     * Bulk update general settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'default_currency' => 'nullable|string|max:10',
            'timezone'         => 'nullable|string|max:255',
            'date_format'      => 'nullable|string|max:20',
        ]);

        foreach ($validated as $key => $value) {
            if ($value !== null) {
                GeneralSetting::setValue($key, $value);
            }
        }

        return response()->json([
            'message'  => 'Settings updated successfully',
            'settings' => GeneralSetting::all()->pluck('value', 'key'),
        ]);
    }
}
