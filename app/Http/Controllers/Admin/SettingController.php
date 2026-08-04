<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    /**
     * Retrieve all settings as a flat key-value array.
     */
    public function index(): JsonResponse
    {
        $settings = Setting::pluck('value', 'key');

        return response()->json([
            'success' => true,
            'data'    => $settings
        ]);
    }

    /**
     * Bulk update/insert settings.
     */
    public function update(UpdateSettingRequest $request): JsonResponse
    {
        $settingsPayload = $request->validated('settings');

        foreach ($settingsPayload as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value']]
            );
        }

        // Return updated list
        $settings = Setting::pluck('value', 'key');

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully.',
            'data'    => $settings
        ]);
    }
}
