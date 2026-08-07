<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
            'data'    => $settings,
        ]);
    }

    /**
     * PUT /api/v1/admin/settings
     * Bulk update/insert settings.
     */
    public function update(UpdateSettingRequest $request): JsonResponse
    {
        $settingsPayload = $request->validated('settings');

        foreach ($settingsPayload as $setting) {
            Setting::updateOrCreate(
                ['key'   => $setting['key']],
                ['value' => $setting['value'] ?? '']
            );
        }

        // Invalidate public cache after every write
        Setting::forgetPublicCache();

        $settings = Setting::pluck('value', 'key');

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully.',
            'data'    => $settings,
        ]);
    }

    /**
     * PATCH /api/v1/admin/settings/{key}
     *
     * Update (or insert) a single setting by key.
     * If the request contains a file under `value`, it is stored in
     * local public storage and the URL is saved as the value.
     * Invalidates the public site-settings cache.
     *
     * Request (multipart/form-data OR application/json):
     *   value  — string  (text value)        [required without file]
     *   file   — file    (image/document)    [required without value]
     */
    public function patchKey(Request $request, string $key): JsonResponse
    {
        $request->validate([
            'value' => ['required_without:file', 'nullable', 'string', 'max:1000'],
            'file'  => ['required_without:value', 'file', 'max:5120',
                        'mimes:jpg,jpeg,png,webp,gif,svg,pdf'],
        ]);

        if ($request->hasFile('file')) {
            $path  = $request->file('file')->store("settings/{$key}", 'public');
            $value = Storage::disk('public')->url($path);
        } else {
            $value = $request->input('value');
        }

        Setting::updateOrCreate(['key' => $key], ['value' => $value]);

        // Invalidate public cache unconditionally
        Setting::forgetPublicCache();

        return response()->json([
            'success' => true,
            'message' => "Setting '{$key}' updated.",
            'data'    => ['key' => $key, 'value' => $value],
        ]);
    }
}
