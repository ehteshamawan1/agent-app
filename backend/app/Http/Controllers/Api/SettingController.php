<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all();
        return response()->json(['settings' => $settings]);
    }

    public function show($key)
    {
        $setting = Setting::where('key', $key)->first();
        if (!$setting) {
            return response()->json(['message' => 'Setting not found'], 404);
        }
        return response()->json([
            'key' => $setting->key,
            'value' => $setting->value,
            'setting' => $setting,
        ]);
    }

    public function update(Request $request, $key)
    {
        $validated = $request->validate([
            'value' => 'required|string',
        ]);

        $setting = Setting::updateOrCreate(
            ['key' => $key],
            ['value' => $validated['value']]
        );

        return response()->json([
            'message' => 'Setting updated successfully',
            'setting' => $setting
        ]);
    }
}
