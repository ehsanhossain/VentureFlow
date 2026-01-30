<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;


class PartnerSettingController extends Controller
{
    public function index()
    {
        $settings = \App\Models\PartnerSetting::all()->pluck('setting_value', 'setting_key');
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'array'
        ]);

        foreach ($data['settings'] as $key => $value) {
            \App\Models\PartnerSetting::updateOrCreate(
                ['setting_key' => $key],
                ['setting_value' => $value]
            );
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
